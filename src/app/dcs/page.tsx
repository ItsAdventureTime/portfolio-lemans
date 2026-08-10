import { getDemoRole } from '@/lib/actor';
import {
  listDisbursements,
  approveDisbursement,
  recordDisbursementPayment,
  getProofUploadUrl,
  attachProofOfPayment,
  getProofDownloadUrl,
} from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { hasPermission } from '@/lib/roles';
import { DataTable, StatusBadge, FormField } from '@/components/ui';
import type { Disbursement } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export default async function DcsPage() {
  const role = await getDemoRole();
  const disbursements = await listDisbursements(role);
  const canApprove = hasPermission(role, 'disburseApprove');
  const canPay = hasPermission(role, 'disburseRecordPayment');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Disbursements & Payments (DCS)</h1>

      <DataTable<Disbursement>
        items={disbursements}
        caption="Disbursement list"
        emptyTitle="No disbursements"
        emptyDescription="Approve OPEX or supplier invoices to generate disbursements."
        columns={[
          { key: 'no', header: 'Disbursement No', render: (d) => d.disbursement_no },
          {
            key: 'source',
            header: 'Source',
            render: (d) => d.opex_request_no || d.supplier_invoice_no || '—',
          },
          { key: 'amount', header: 'Amount', render: (d) => formatPeso(d.amount_cents) },
          {
            key: 'status',
            header: 'Status',
            render: (d) => <StatusBadge status={d.status} />,
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (d) => (
              <div className="flex flex-wrap gap-2">
                {d.status === 'PENDING' && canApprove && (
                  <form
                    action={async () => {
                      'use server';
                      const r = (await import('@/lib/actor')).getDemoRole();
                      await approveDisbursement(d.id, await r);
                      revalidatePath('/dcs');
                    }}
                  >
                    <button className="inline-flex items-center h-8 px-3 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-hover transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">
                      Approve
                    </button>
                  </form>
                )}
                {d.status === 'APPROVED' && canPay && (
                  <form
                    action={async (formData: FormData) => {
                      'use server';
                      const r = (await import('@/lib/actor')).getDemoRole();
                      const file = formData.get('proof') as File | null;
                      const paymentMethod = String(formData.get('paymentMethod')).trim();
                      if (!paymentMethod) {
                        throw new Error('Payment method is required');
                      }
                      const body = {
                        paymentMethod,
                        referenceNo: String(formData.get('referenceNo')),
                        paidAt: new Date().toISOString(),
                      };
                      if (file && file.size > 0) {
                        const { key, url } = await getProofUploadUrl(
                          d.id,
                          file.name,
                          file.type,
                          await r
                        );
                        await fetch(url, {
                          method: 'PUT',
                          body: file,
                          headers: { 'Content-Type': file.type },
                        });
                        await attachProofOfPayment(d.id, key, await r);
                      }
                      await recordDisbursementPayment(d.id, body, await r);
                      revalidatePath('/dcs');
                    }}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <FormField
                      label=""
                      name="paymentMethod"
                      required
                      placeholder="Method"
                      className="w-28"
                    />
                    <FormField label="" name="referenceNo" placeholder="Ref" className="w-28" />
                    <div className="space-y-1">
                      <label htmlFor={`proof-${d.id}`} className="sr-only">
                        Proof of payment
                      </label>
                      <input
                        id={`proof-${d.id}`}
                        name="proof"
                        type="file"
                        className="text-xs w-40 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                      />
                    </div>
                    <button className="inline-flex items-center h-8 px-3 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-hover transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">
                      Pay
                    </button>
                  </form>
                )}
                {d.proof_attachment_key && (
                  <form
                    action={async () => {
                      'use server';
                      const r = (await import('@/lib/actor')).getDemoRole();
                      const { url } = await getProofDownloadUrl(d.id, await r);
                      if (url) {
                        return url;
                      }
                    }}
                  >
                    <button className="inline-flex items-center h-8 px-3 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2">
                      Proof
                    </button>
                  </form>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
