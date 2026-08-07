'use server';

import { revalidatePath } from 'next/cache';
import { PRStatus, POStatus, SIStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

export async function approvePurchaseRequest(prId: string) {
  const session = await requirePermission('prApprove');
  const pr = await db.purchaseRequest.findUnique({
    where: { id: prId },
    include: { items: true },
  });
  if (!pr) throw new Error('Purchase request not found');
  if (pr.status !== 'PENDING_APPROVAL') throw new Error('PR is not pending approval');

  const total = pr.items.reduce((sum, item) => sum + item.total, 0);

  await db.$transaction(async (tx) => {
    await tx.purchaseRequest.update({
      where: { id: prId },
      data: {
        status: 'APPROVED',
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    const count = await tx.purchaseOrder.count();
    const poNo = `PO-${new Date().getFullYear()}-${String(1000 + count + 1).slice(1)}`;

    await tx.purchaseOrder.create({
      data: {
        poNo,
        prId: pr.id,
        status: 'DRAFT',
        supplier: pr.items[0]?.description ?? 'Supplier',
        total,
        items: {
          create: pr.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: item.total,
          })),
        },
      },
    });
  });

  revalidatePath('/purchasing');
}

export async function createSupplierInvoice(input: {
  poId?: string;
  supplier: string;
  totalAmount: number;
  notes?: string;
}) {
  const session = await requirePermission('supplierInvoiceCreate');
  const count = await db.supplierInvoice.count();
  const siNo = `SI-${new Date().getFullYear()}-${String(1000 + count + 1).slice(1)}`;

  await db.supplierInvoice.create({
    data: {
      siNo,
      poId: input.poId,
      supplier: input.supplier,
      totalAmount: input.totalAmount,
      status: 'DRAFT',
      notes: input.notes,
    },
  });

  revalidatePath('/purchasing');
}

export async function allocateSupplierInvoice(
  siId: string,
  allocations: Array<{ joId: string; amount: number; description?: string }>
) {
  const session = await requirePermission('supplierInvoiceAllocate');
  const si = await db.supplierInvoice.findUnique({
    where: { id: siId },
    include: { allocations: true },
  });
  if (!si) throw new Error('Supplier invoice not found');

  const allocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  if (Math.abs(allocated - si.totalAmount) > 0.01) {
    throw new Error('Allocations must equal invoice total amount');
  }

  await db.$transaction(async (tx) => {
    await tx.supplierInvoiceAllocation.deleteMany({ where: { siId } });
    await tx.supplierInvoiceAllocation.createMany({
      data: allocations.map((a) => ({
        siId,
        joId: a.joId,
        amount: a.amount,
        description: a.description ?? '',
      })),
    });
    await tx.supplierInvoice.update({
      where: { id: siId },
      data: { status: 'ALLOCATED' },
    });
  });

  revalidatePath('/purchasing');
  revalidatePath('/job-costing');
}

export async function approveSupplierInvoice(siId: string) {
  await requirePermission('supplierInvoiceApprove');
  await db.supplierInvoice.update({
    where: { id: siId },
    data: { status: 'APPROVED' },
  });
  revalidatePath('/purchasing');
}

export async function createPurchaseRequestFromJo(
  joId: string,
  items: Array<{ description: string; quantity: number; unitCost: number }>
) {
  const session = await requirePermission('prCreate');
  const count = await db.purchaseRequest.count();
  const prNo = `PR-${new Date().getFullYear()}-${String(1000 + count + 1).slice(1)}`;
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  await db.purchaseRequest.create({
    data: {
      prNo,
      joId,
      status: 'PENDING_APPROVAL',
      requestedById: session.user.id,
      notes: 'Created from job order parts estimate',
      items: {
        create: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitCost: item.unitCost,
          total: item.quantity * item.unitCost,
        })),
      },
    },
  });

  revalidatePath('/purchasing');
}
