import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { Wallet, CheckCircle, Upload } from 'lucide-react';
import { approveDisbursement, recordPayment } from '@/lib/actions/dcs';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';

export default async function DcsPage() {
  const session = await auth.api.getSession({ headers: headers() });
  const canApprove = hasPermission(session?.user.role, 'disburseApprove');
  const canPay = hasPermission(session?.user.role, 'disburseRecordPayment');

  const disbursements = await db.disbursement.findMany({
    include: { opexRequest: true, supplierInvoice: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <Wallet className="h-5 w-5 text-slate-700" />
          <span>DCS Disbursements</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          GM-approved disbursements awaiting payment execution by DCS.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-bold text-slate-900">Disbursement List</h3>
        </div>
        <div className="p-5 space-y-4">
          {disbursements.map((d) => {
            async function approveFormAction() {
              'use server';
              await approveDisbursement(d.id);
            }

            async function payFormAction(formData: FormData) {
              'use server';
              await recordPayment(d.id, {
                paymentMethod: String(formData.get('paymentMethod')),
                referenceNo: String(formData.get('referenceNo') || ''),
                paidAt: new Date(String(formData.get('paidAt'))),
              });
            }

            return (
              <div key={d.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-base">{d.disbursementNo}</span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {d.status}
                    </span>
                  </div>
                  <span className="font-mono text-base font-bold">₱{d.amount.toFixed(2)}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {d.opexRequest
                    ? `OPEX: ${d.opexRequest.requestNo}`
                    : d.supplierInvoice
                      ? `Supplier Invoice: ${d.supplierInvoice.siNo}`
                      : 'Manual disbursement'}
                </p>

                {d.status === 'PENDING' && canApprove && (
                  <form action={approveFormAction} className="mt-3">
                    <button
                      type="submit"
                      className="whitespace-nowrap inline-flex items-center justify-center h-9 px-4 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Approve for Payment (GM)
                    </button>
                  </form>
                )}

                {d.status === 'APPROVED' && canPay && (
                  <form
                    action={payFormAction}
                    className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3"
                  >
                    <input
                      name="paymentMethod"
                      placeholder="Payment method (Cheque / Bank)"
                      required
                      defaultValue={d.paymentMethod ?? ''}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-base"
                    />
                    <input
                      name="referenceNo"
                      placeholder="Cheque / Ref #"
                      defaultValue={d.referenceNo ?? ''}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-base"
                    />
                    <input
                      name="paidAt"
                      type="date"
                      required
                      defaultValue={d.paidAt ? new Date(d.paidAt).toISOString().split('T')[0] : ''}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-base"
                    />
                    <button
                      type="submit"
                      className="whitespace-nowrap inline-flex items-center justify-center h-9 px-4 bg-[#d32f2f] text-white rounded-xl text-sm font-semibold hover:bg-[#b71c1c]"
                    >
                      <Upload className="h-4 w-4 mr-1.5" />
                      Record Payment
                    </button>
                  </form>
                )}

                {d.status === 'PAID' && d.referenceNo && (
                  <p className="mt-3 text-sm text-slate-500">
                    Paid via {d.paymentMethod} • Ref {d.referenceNo} •{' '}
                    {d.paidAt ? new Date(d.paidAt).toLocaleDateString() : 'N/A'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
