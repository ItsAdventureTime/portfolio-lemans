import { db } from '@/lib/db';
import { Receipt, Plus, CheckCircle } from 'lucide-react';
import { approveOpexRequest, createOpexRequest } from '@/lib/actions/expenses';

export default async function ExpensesPage() {
  const opexRequests = await db.opexRequest.findMany({
    orderBy: { requestedAt: 'desc' },
  });

  async function createFormAction(formData: FormData) {
    'use server';
    await createOpexRequest({
      category: String(formData.get('category')),
      description: String(formData.get('description')),
      amount: Number(formData.get('amount')),
      notes: String(formData.get('notes') || ''),
    });
  }

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
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">New OPEX Request</h3>
        <form action={createFormAction} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input
            name="category"
            placeholder="Category"
            required
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <input
            name="description"
            placeholder="Description"
            required
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="Amount"
            required
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <input
            name="notes"
            placeholder="Notes"
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-semibold hover:bg-brand-hover flex items-center justify-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>Submit</span>
          </button>
        </form>
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
