import { getDemoRole } from '@/lib/actor';
import {
  listDisbursements,
  approveDisbursement,
  recordDisbursementPayment,
  getProofUploadUrl,
  attachProofOfPayment,
  getProofDownloadUrl,
} from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';

export default async function DcsPage() {
  const role = await getDemoRole();
  const disbursements = await listDisbursements(role);
  const canApprove = hasPermission(role, 'disburseApprove');
  const canPay = hasPermission(role, 'disburseRecordPayment');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Disbursements & Payments (DCS)</h1>

      <div className="bg-white rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">Disbursement No</th>
              <th className="text-left px-4 py-2">Source</th>
              <th className="text-left px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {disbursements.map((d: any) => (
              <tr key={d.id}>
                <td className="px-4 py-2">{d.disbursement_no}</td>
                <td className="px-4 py-2">{d.opex_request_no || d.supplier_invoice_no || '—'}</td>
                <td className="px-4 py-2">₱{(d.amount_cents / 100).toFixed(2)}</td>
                <td className="px-4 py-2">{d.status}</td>
                <td className="px-4 py-2">
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
                        <button className="text-xs bg-brand-primary text-white px-2 py-1 rounded">
                          Approve
                        </button>
                      </form>
                    )}
                    {d.status === 'APPROVED' && canPay && (
                      <form
                        action={async (formData: FormData) => {
                          'use server';
                          const r = (await import('@/lib/actor')).getDemoRole();
                          const file = formData.get('proof') as File;
                          const body: any = {
                            paymentMethod: String(formData.get('paymentMethod')),
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
                        className="flex items-center gap-2"
                      >
                        <input
                          name="paymentMethod"
                          placeholder="Method"
                          className="border rounded px-2 py-1 text-xs w-24"
                        />
                        <input
                          name="referenceNo"
                          placeholder="Ref"
                          className="border rounded px-2 py-1 text-xs w-24"
                        />
                        <input name="proof" type="file" className="text-xs" />
                        <button className="text-xs bg-brand-primary text-white px-2 py-1 rounded">
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
                        <button className="text-xs bg-slate-100 px-2 py-1 rounded">Proof</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
