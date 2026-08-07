import { db } from '@/lib/db';
import { Receipt, Plus, CheckCircle } from 'lucide-react';
import { approveOpexRequest } from '@/lib/actions/expenses';

export default async function ExpensesPage() {
  const opexRequests = await db.opexRequest.findMany({
    orderBy: { requestedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-slate-700" />
            <span>OPEX / Budget Requests</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Request, approve, and track operational expenses pending GM approval.
          </p>
        </div>
        <button className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-xl hover:bg-brand-hover transition-colors shadow-sm flex items-center space-x-1.5">
          <Plus className="h-4 w-4" />
          <span>New OPEX Request</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Pending Approval Queue</h3>
        </div>
        <div className="p-5 space-y-4">
          {opexRequests.map((request) => {
            async function approveFormAction() {
              'use server';
              await approveOpexRequest(request.id);
            }

            return (
              <div key={request.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{request.requestNo}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {request.status}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold">₱{request.amount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-700 mt-1">
                  {request.category} • {request.description}
                </p>
                {request.status === 'PENDING_APPROVAL' && (
                  <form action={approveFormAction} className="mt-3">
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center space-x-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Approve (GM)</span>
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
