'use server';

import { revalidatePath } from 'next/cache';
import { OpexStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

export async function createOpexRequest(input: {
  category: string;
  description: string;
  amount: number;
  notes?: string;
}) {
  const session = await requirePermission('opexCreate');
  const count = await db.opexRequest.count();
  const requestNo = `OPEX-${new Date().getFullYear()}-${String(1000 + count + 1).slice(1)}`;

  await db.opexRequest.create({
    data: {
      requestNo,
      category: input.category,
      description: input.description,
      amount: input.amount,
      requestedById: session.user.id,
      status: 'PENDING_APPROVAL',
      notes: input.notes,
    },
  });

  revalidatePath('/expenses');
}

export async function approveOpexRequest(requestId: string) {
  const session = await requirePermission('opexApprove');
  await db.opexRequest.update({
    where: { id: requestId, status: 'PENDING_APPROVAL' },
    data: {
      status: 'APPROVED',
      approvedById: session.user.id,
      approvedAt: new Date(),
    },
  });
  revalidatePath('/expenses');
  revalidatePath('/dcs');
}
