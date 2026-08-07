'use server';

import { revalidatePath } from 'next/cache';
import { JOStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

const ALLOWED_TRANSITIONS: Record<JOStatus, JOStatus[]> = {
  DRAFT: ['APPROVED', 'IN_PROGRESS'],
  APPROVED: ['IN_PROGRESS', 'COMPLETED'],
  IN_PROGRESS: ['PARTS_PENDING', 'COMPLETED'],
  PARTS_PENDING: ['IN_PROGRESS', 'COMPLETED'],
  COMPLETED: ['BILLED', 'CLOSED'],
  BILLED: ['CLOSED'],
  CLOSED: [],
};

export async function convertQuoteToJobOrder(quoteId: string) {
  const session = await requirePermission('quoteConvert');

  const quote = await db.salesQuotation.findUnique({
    where: { id: quoteId },
    include: { items: true },
  });
  if (!quote) throw new Error('Quotation not found');
  if (quote.status !== 'APPROVED') throw new Error('Quotation must be approved before conversion');

  const count = await db.jobOrder.count();
  const joNo = `RA${String(1000000 + count + 1).slice(1)}`;

  const jo = await db.jobOrder.create({
    data: {
      joNo,
      sqId: quote.id,
      customerId: quote.customerId,
      vehicleId: quote.vehicleId,
      advisor: quote.advisor,
      status: 'IN_PROGRESS',
      totalEstimatedLabor: quote.totalLabor,
      totalEstimatedParts: quote.totalParts,
      items: {
        create: quote.items.map((item) => ({
          itemType: item.itemType,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          netAmount: item.netAmount,
        })),
      },
    },
  });

  await db.salesQuotation.update({
    where: { id: quoteId },
    data: { status: 'CONVERTED' },
  });

  await db.jobOrderEvent.create({
    data: {
      joId: jo.id,
      eventType: 'CONVERTED',
      description: `Converted from quotation ${quote.quoteNo}`,
      createdById: session.user.id,
    },
  });

  revalidatePath('/quotations');
  revalidatePath('/job-orders');
  return jo;
}

export async function assignTechnician(joId: string, technician: string) {
  const session = await requirePermission('joAssignTech');
  await db.jobOrder.update({
    where: { id: joId },
    data: { technician },
  });
  await db.jobOrderEvent.create({
    data: {
      joId,
      eventType: 'TECHNICIAN_ASSIGNED',
      description: `Technician assigned: ${technician}`,
      createdById: session.user.id,
    },
  });
  revalidatePath(`/job-orders/${joId}`);
  revalidatePath('/job-orders');
}

export async function transitionJobOrderStatus(joId: string, nextStatus: JOStatus) {
  const session = await requirePermission('joChangeStatus');
  const jo = await db.jobOrder.findUnique({ where: { id: joId } });
  if (!jo) throw new Error('Job order not found');

  const allowed = ALLOWED_TRANSITIONS[jo.status];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Invalid status transition from ${jo.status} to ${nextStatus}`);
  }

  await db.jobOrder.update({
    where: { id: joId },
    data: { status: nextStatus },
  });

  await db.jobOrderEvent.create({
    data: {
      joId,
      eventType: 'STATUS_CHANGE',
      description: `Status changed from ${jo.status} to ${nextStatus}`,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/job-orders/${joId}`);
  revalidatePath('/job-orders');
}

export async function addJobOrderEvent(joId: string, eventType: string, description: string) {
  const session = await requirePermission('joChangeStatus');
  await db.jobOrderEvent.create({
    data: {
      joId,
      eventType,
      description,
      createdById: session.user.id,
    },
  });
  revalidatePath(`/job-orders/${joId}`);
}

export async function createCustomerAndVehicle(input: {
  customer: {
    customerNo: string;
    name: string;
    tin?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  vehicle: {
    plateNo: string;
    makeModel: string;
    vinChassis?: string;
    engineNo?: string;
    year?: string;
    color?: string;
    odometer?: number;
  };
}) {
  const session = await requirePermission('customerCreate');

  const existingCustomer = await db.customer.findUnique({
    where: { customerNo: input.customer.customerNo },
  });
  if (existingCustomer) {
    throw new Error(`Customer number ${input.customer.customerNo} already exists`);
  }

  const existingVehicle = await db.vehicle.findUnique({
    where: { plateNo: input.vehicle.plateNo },
  });
  if (existingVehicle) {
    throw new Error(`Plate number ${input.vehicle.plateNo} already exists`);
  }

  await db.customer.create({
    data: {
      customerNo: input.customer.customerNo,
      name: input.customer.name,
      tin: input.customer.tin,
      address: input.customer.address,
      phone: input.customer.phone,
      email: input.customer.email,
      vehicles: {
        create: {
          plateNo: input.vehicle.plateNo,
          makeModel: input.vehicle.makeModel,
          vinChassis: input.vehicle.vinChassis,
          engineNo: input.vehicle.engineNo,
          year: input.vehicle.year,
          color: input.vehicle.color,
          odometer: input.vehicle.odometer,
        },
      },
    },
  });

  revalidatePath('/customers');
}

export async function createSalesQuotation(input: {
  customerId: string;
  vehicleId: string;
  advisor: string;
  items: Array<{
    itemType: 'LABOR' | 'PARTS' | 'MISC';
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>;
}) {
  const session = await requirePermission('salesQuotationCreate');

  const totalLabor = input.items
    .filter((i) => i.itemType === 'LABOR')
    .reduce((sum, i) => sum + (i.quantity * i.unitPrice - i.discount), 0);
  const totalParts = input.items
    .filter((i) => i.itemType === 'PARTS')
    .reduce((sum, i) => sum + (i.quantity * i.unitPrice - i.discount), 0);
  const netTotal = input.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice - i.discount), 0);

  const count = await db.salesQuotation.count();
  const quoteNo = `SQ-${new Date().getFullYear()}-${String(1000 + count + 1).slice(1)}`;

  await db.salesQuotation.create({
    data: {
      quoteNo,
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      advisor: input.advisor,
      totalLabor,
      totalParts,
      netTotal,
      status: 'DRAFT',
      items: {
        create: input.items.map((i) => ({
          itemType: i.itemType,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
          netAmount: i.quantity * i.unitPrice - i.discount,
        })),
      },
    },
  });

  revalidatePath('/quotations');
}
