import { db } from '@/lib/db';
import { ShoppingCart, CheckCircle, Plus, FilePlus } from 'lucide-react';
import {
  approvePurchaseRequest,
  createPurchaseRequest,
  createSupplierInvoice,
  allocateSupplierInvoice,
  approveSupplierInvoice,
} from '@/lib/actions/purchasing';

export default async function PurchasingPage() {
  const purchaseRequests = await db.purchaseRequest.findMany({
    include: { items: true, jo: true },
    orderBy: { requestedAt: 'desc' },
  });

  const supplierInvoices = await db.supplierInvoice.findMany({
    include: { allocations: { include: { jo: true } }, po: true },
    orderBy: { invoiceDate: 'desc' },
  });

  const jobOrders = await db.jobOrder.findMany({
    where: { status: { not: 'CLOSED' } },
    select: { id: true, joNo: true },
    orderBy: { createdAt: 'desc' },
  });

  async function createPrFormAction(formData: FormData) {
    'use server';
    const lines = String(formData.get('items') || '')
      .split('\n')
      .map((line) => {
        const [description, qty, cost] = line.split('|').map((s) => s.trim());
        return {
          description,
          quantity: Number(qty) || 1,
          unitCost: Number(cost) || 0,
        };
      })
      .filter((i) => i.description);

    await createPurchaseRequest({
      supplier: String(formData.get('supplier')),
      notes: String(formData.get('notes') || ''),
      items: lines,
    });
  }

  async function createSiFormAction(formData: FormData) {
    'use server';
    await createSupplierInvoice({
      supplier: String(formData.get('supplier')),
      totalAmount: Number(formData.get('totalAmount')),
      notes: String(formData.get('notes') || ''),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-slate-700" />
            <span>Purchasing</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Purchase Requests, Orders, Supplier Invoices, and multi-JO allocations.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">New Purchase Request</h3>
        <form action={createPrFormAction} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              name="supplier"
              placeholder="Supplier / Vendor"
              required
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <input
              name="notes"
              placeholder="Notes"
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <textarea
            name="items"
            placeholder={`Line format: description | qty | unitCost\nExample: Brake pads set | 1 | 2500`}
            required
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-semibold hover:bg-brand-hover flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>Create Purchase Request</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Record Supplier Invoice</h3>
        <form action={createSiFormAction} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            name="supplier"
            placeholder="Supplier"
            required
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <input
            name="totalAmount"
            type="number"
            step="0.01"
            placeholder="Total Amount"
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
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 flex items-center justify-center space-x-1"
          >
            <FilePlus className="h-4 w-4" />
            <span>Record Invoice</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Purchase Requests</h3>
        </div>
        <div className="p-5 space-y-4">
          {purchaseRequests.map((pr) => {
            async function approveFormAction() {
              'use server';
              await approvePurchaseRequest(pr.id);
            }

            return (
              <div key={pr.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{pr.prNo}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {pr.status}
                    </span>
                  </div>
                  {pr.status === 'PENDING_APPROVAL' && (
                    <form action={approveFormAction}>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center space-x-1"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Approve & Create PO</span>
                      </button>
                    </form>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  JO: {pr.jo?.joNo ?? 'N/A'} • Items: {pr.items.length}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Supplier Invoices</h3>
        </div>
        <div className="p-5 space-y-4">
          {supplierInvoices.map((si) => {
            async function allocateFormAction(formData: FormData) {
              'use server';
              const allocationIds = formData.getAll('allocationJoId') as string[];
              const allocationAmounts = formData.getAll('allocationAmount') as string[];
              const allocationDescs = formData.getAll('allocationDescription') as string[];
              const allocations = allocationIds
                .map((joId, idx) => ({
                  joId,
                  amount: Number(allocationAmounts[idx]) || 0,
                  description: allocationDescs[idx] || '',
                }))
                .filter((a) => a.joId && a.amount > 0);

              await allocateSupplierInvoice(si.id, allocations);
            }

            async function approveSiFormAction() {
              'use server';
              await approveSupplierInvoice(si.id);
            }

            const allocatedTotal = si.allocations.reduce((sum, a) => sum + a.amount, 0);
            const remaining = si.totalAmount - allocatedTotal;

            return (
              <div key={si.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{si.siNo}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {si.status}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold">₱{si.totalAmount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Supplier: {si.supplier} • Allocations: {si.allocations.length}
                </p>

                {si.allocations.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                    {si.allocations.map((a) => (
                      <div key={a.id} className="flex justify-between text-xs">
                        <span className="text-slate-700">
                          {a.jo.joNo} {a.description && `• ${a.description}`}
                        </span>
                        <span className="font-mono">₱{a.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200">
                      <span>Remaining</span>
                      <span className="font-mono">₱{remaining.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {si.status !== 'PAID' && si.status !== 'CANCELLED' && remaining > 0.01 && (
                  <form action={allocateFormAction} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        name="allocationJoId"
                        required
                        className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      >
                        <option value="">Select Job Order</option>
                        {jobOrders.map((jo) => (
                          <option key={jo.id} value={jo.id}>
                            {jo.joNo}
                          </option>
                        ))}
                      </select>
                      <input
                        name="allocationAmount"
                        type="number"
                        step="0.01"
                        max={remaining}
                        placeholder={`Amount (max ₱${remaining.toFixed(2)})`}
                        required
                        className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                      <input
                        name="allocationDescription"
                        placeholder="Description"
                        className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-semibold hover:bg-brand-hover"
                    >
                      Allocate to JO
                    </button>
                  </form>
                )}

                {si.status === 'ALLOCATED' && (
                  <form action={approveSiFormAction}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center space-x-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Approve Invoice (GM)</span>
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
