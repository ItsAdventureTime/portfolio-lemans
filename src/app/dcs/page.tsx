import { db } from '@/lib/db';
import { Wallet, CheckCircle } from 'lucide-react';
import { approveDisbursement } from '@/lib/actions/dcs';

export default async function DcsPage() {
  const disbursements = await db.disbursement.findMany({
    include: { opexRequest: true, supplierInvoice: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Wallet className="h-5 w-5 text-slate-700" />
          <span>DCS Disbursements</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          GM-approved disbursements awaiting payment execution by DCS.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Disbursement List</h3>
        </div>
        <div className="p-5 space-y-4">
          {disbursements.map((d) => {
            async function approveFormAction() {
              'use server';
              await approveDisbursement(d.id);
            }

            return (
              <div key={d.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{d.disbursementNo}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {d.status}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold">₱{d.amount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {d.opexRequest
                    ? `OPEX: ${d.opexRequest.requestNo}`
                    : d.supplierInvoice
                      ? `Supplier Invoice: ${d.supplierInvoice.siNo}`
                      : 'Manual disbursement'}
                </p>
                {d.status === 'PENDING' && (
                  <form action={approveFormAction} className="mt-3">
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center space-x-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Approve for Payment (GM)</span>
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
