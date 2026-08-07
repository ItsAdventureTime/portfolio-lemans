import { db } from '@/lib/db';
import { ShoppingCart, CheckCircle, Plus } from 'lucide-react';
import { approvePurchaseRequest } from '@/lib/actions/purchasing';

export default async function PurchasingPage() {
  const purchaseRequests = await db.purchaseRequest.findMany({
    include: { items: true, jo: true },
    orderBy: { requestedAt: 'desc' },
  });

  const supplierInvoices = await db.supplierInvoice.findMany({
    include: { allocations: true, po: true },
    orderBy: { invoiceDate: 'desc' },
  });

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
        <button className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-xl hover:bg-brand-hover transition-colors shadow-sm flex items-center space-x-1.5">
          <Plus className="h-4 w-4" />
          <span>New Purchase Request</span>
        </button>
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
          {supplierInvoices.map((si) => (
            <div key={si.id} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">{si.siNo}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {si.status}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold">₱{si.totalAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Supplier: {si.supplier} • Allocations: {si.allocations.length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
