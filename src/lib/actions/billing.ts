'use server';

import { revalidatePath } from 'next/cache';
import { ServiceInvoiceStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { calculateVat, calculateInvoiceTotal } from '@/lib/costing';

export async function generateServiceInvoice(joId: string, notes?: string) {
  const session = await requirePermission('invoiceCreate');
  const jo = await db.jobOrder.findUnique({
    where: { id: joId },
    include: { customer: true, items: true },
  });
  if (!jo) throw new Error('Job order not found');
  if (jo.status !== 'COMPLETED') {
    throw new Error('Job order must be completed before invoicing');
  }

  const existing = await db.serviceInvoice.findUnique({ where: { joId } });
  if (existing) throw new Error('An invoice already exists for this job order');

  const subtotal = jo.items.reduce((sum, item) => sum + item.netAmount, 0);
  const vatAmount = calculateVat(subtotal, false);
  const total = calculateInvoiceTotal(subtotal, false);

  const count = await db.serviceInvoice.count();
  const invoiceNo = `INV-${new Date().getFullYear()}-${String(1000 + count + 1).slice(1)}`;

  const invoice = await db.serviceInvoice.create({
    data: {
      invoiceNo,
      joId,
      customerId: jo.customerId,
      subtotal,
      vatAmount,
      total,
      status: 'SENT',
      notes,
    },
  });

  await db.jobOrder.update({
    where: { id: joId },
    data: { status: 'BILLED', billedAmount: total },
  });

  revalidatePath('/invoices');
  revalidatePath(`/job-orders/${joId}`);
  return invoice;
}

export async function recordCustomerPayment(
  invoiceId: string,
  input: {
    amount: number;
    paymentMethod: string;
    referenceNo?: string;
  }
) {
  const session = await requirePermission('invoiceRecordPayment');
  const invoice = await db.serviceInvoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) throw new Error('Invoice not found');

  const paidSoFar = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const newPaid = paidSoFar + input.amount;

  const status: ServiceInvoiceStatus =
    newPaid >= invoice.total ? 'PAID' : newPaid > 0 ? 'PARTIAL' : invoice.status;

  await db.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        serviceInvoiceId: invoiceId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        referenceNo: input.referenceNo,
        recordedById: session.user.id,
      },
    });
    await tx.serviceInvoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newPaid,
        status,
      },
    });
  });

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${invoiceId}`);
}
