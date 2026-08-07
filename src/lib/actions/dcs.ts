'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { generateUploadUrl, generateDownloadUrl } from '@/lib/b2';

export async function getProofUploadUrl(
  disbursementId: string,
  fileName: string,
  contentType: string
) {
  const session = await requirePermission('disburseRecordPayment');
  const key = `attachments/dcs-payment/${disbursementId}/${crypto.randomUUID()}-${fileName}`;
  const url = await generateUploadUrl(key, contentType);
  return { key, url };
}

export async function attachProofOfPayment(disbursementId: string, storageKey: string) {
  await requirePermission('disburseRecordPayment');
  await db.disbursement.update({
    where: { id: disbursementId },
    data: { proofAttachmentKey: storageKey },
  });
  revalidatePath('/dcs');
}

export async function getProofDownloadUrl(disbursementId: string) {
  await requirePermission('disburseRecordPayment');
  const disbursement = await db.disbursement.findUnique({
    where: { id: disbursementId },
  });
  if (!disbursement?.proofAttachmentKey) return null;
  return generateDownloadUrl(disbursement.proofAttachmentKey);
}

export async function approveDisbursement(disbursementId: string) {
  const session = await requirePermission('disburseApprove');
  await db.disbursement.update({
    where: { id: disbursementId },
    data: {
      status: 'APPROVED',
      recordedById: session.user.id,
    },
  });
  revalidatePath('/dcs');
}

export async function recordPayment(
  disbursementId: string,
  input: {
    paymentMethod: string;
    referenceNo?: string;
    paidAt: Date;
  }
) {
  const session = await requirePermission('disburseRecordPayment');
  const disbursement = await db.disbursement.findUnique({
    where: { id: disbursementId },
  });
  if (!disbursement) throw new Error('Disbursement not found');
  if (disbursement.status !== 'APPROVED') {
    throw new Error('Disbursement must be approved before payment');
  }

  await db.disbursement.update({
    where: { id: disbursementId },
    data: {
      status: 'PAID',
      paymentMethod: input.paymentMethod,
      referenceNo: input.referenceNo,
      paidAt: input.paidAt,
      recordedById: session.user.id,
    },
  });

  revalidatePath('/dcs');
}
