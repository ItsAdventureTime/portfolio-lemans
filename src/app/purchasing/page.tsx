import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { ShoppingCart, CheckCircle, Plus, FilePlus, ArrowRight } from 'lucide-react';
import {
  approvePurchaseRequest,
  createPurchaseRequest,
  createSupplierInvoice,
  allocateSupplierInvoice,
  approveSupplierInvoice,
} from '@/lib/actions/purchasing';
import { hasPermission } from '@/lib/roles';
import MultiJoAllocationModal from '@/components/multi-jo-allocation-modal';
import SalesQuoteBuilder from '@/components/sales-quote-builder';

export default async function PurchasingPage() {
  const session = await auth.api.getSession({ headers: headers() });
  const canApprove = hasPermission(session?.user.role, 'supplierInvoiceApprove');
  const canAllocate = hasPermission(session?.user.role, 'supplierInvoiceAllocate');

  const [purchaseRequests, supplierInvoices, jobOrders] = await Promise.all([
    db.purchaseRequest.findMany({
      include: { items: true, jo: true },
      orderBy: { requestedAt: 'desc' },
    }),
    db.supplierInvoice.findMany({
      include: { allocations: { include: { jo: true } }, po: true },
      orderBy: { invoiceDate: 'desc' },
    }),
    db.jobOrder.findMany({
      where: { status: { not: 'CLOSED' } },
      include: { customer: true, vehicle: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  async function createPrFormAction(formData: FormData) {
    'use server';
    const rawItems = String(formData.get('items') || '');
    const items = rawItems
      ? (JSON.parse(rawItems) as Array<{
          description: string;
          quantity: number;
          unitPrice: number;
        }>)
      : [];

    await createPurchaseRequest({
      supplier: String(formData.get('supplier')),
      notes: String(formData.get('notes') || ''),
      items: items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitCost: i.unitPrice,
      })),
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
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-slate-700" />
            <span>Purchasing</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Purchase Requests, Orders, Supplier Invoices, and multi-JO allocations.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">New Purchase Request</h3>
        <form action={createPrFormAction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              name="supplier"
              placeholder="Supplier / Vendor"
              required
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
            <input
              name="notes"
              placeholder="Notes"
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
          </div>
          <SalesQuoteBuilder
            name="items"
            initialItems={[
              {
                id: 'pr-1',
                itemType: 'PARTS',
                description: '',
                quantity: 1,
                unitPrice: 0,
                discount: 0,
              },
            ]}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#d32f2f] text-white rounded-xl text-sm font-semibold hover:bg-[#b71c1c] flex items-center space-x-1 whitespace-nowrap h-9"
          >
            <Plus className="h-4 w-4" />
            <span>Create Purchase Request</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Record Supplier Invoice</h3>
        <form action={createSiFormAction} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            name="supplier"
            placeholder="Supplier"
            required
            className="px-3 py-2 rounded-xl border border-slate-300 text-base"
          />
          <input
            name="totalAmount"
            type="number"
            step="0.01"
            placeholder="Total Amount"
            required
            className="px-3 py-2 rounded-xl border border-slate-300 text-base"
          />
          <input
            name="notes"
            placeholder="Notes"
            className="px-3 py-2 rounded-xl border border-slate-300 text-base"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 flex items-center justify-center space-x-1 whitespace-nowrap h-9"
          >
            <FilePlus className="h-4 w-4" />
            <span>Record Invoice</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-bold text-slate-900">Purchase Requests</h3>
        </div>
        <div className="p-5 space-y-4">
          {purchaseRequests.map((pr: (typeof purchaseRequests)[number]) => {
            async function approveFormAction() {
              'use server';
              await approvePurchaseRequest(pr.id);
            }

            return (
              <div key={pr.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-base">{pr.prNo}</span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {pr.status}
                    </span>
                  </div>
                  {pr.status === 'PENDING_APPROVAL' && (
                    <form action={approveFormAction}>
                      <button
                        type="submit"
                        className="whitespace-nowrap inline-flex items-center justify-center h-9 px-4 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Approve & Create PO
                      </button>
                    </form>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  JO: {pr.jo?.joNo ?? 'N/A'} • Items: {pr.items.length}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-bold text-slate-900">Supplier Invoices</h3>
        </div>
        <div className="p-5 space-y-4">
          {supplierInvoices.map((si: (typeof supplierInvoices)[number]) => {
            async function approveSiFormAction() {
              'use server';
              await approveSupplierInvoice(si.id);
            }

            const allocatedTotal = si.allocations.reduce(
              (sum: number, a: (typeof si.allocations)[number]) => sum + a.amount,
              0
            );
            const remaining = si.totalAmount - allocatedTotal;

            return (
              <div key={si.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-base">{si.siNo}</span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {si.status}
                    </span>
                  </div>
                  <span className="font-mono text-base font-bold">
                    ₱{si.totalAmount.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  Supplier: {si.supplier} • Allocations: {si.allocations.length}
                </p>

                {si.allocations.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                    {si.allocations.map((a: (typeof si.allocations)[number]) => (
                      <div key={a.id} className="flex justify-between text-base">
                        <span className="text-slate-700">
                          {a.jo.joNo} {a.description && `• ${a.description}`}
                        </span>
                        <span className="font-mono">₱{a.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200">
                      <span>Remaining</span>
                      <span className="font-mono">₱{remaining.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {canAllocate &&
                  si.status !== 'PAID' &&
                  si.status !== 'CANCELLED' &&
                  remaining > 0.01 && (
                    <MultiJoAllocationModal
                      open={true}
                      onClose={() => {}}
                      invoiceAmount={si.totalAmount}
                      jobOrders={jobOrders.map((jo: (typeof jobOrders)[number]) => ({
                        id: jo.id,
                        joNo: jo.joNo,
                        customerName: jo.customer.name,
                        makeModel: jo.vehicle.makeModel,
                      }))}
                      initialAllocations={si.allocations.map(
                        (a: (typeof si.allocations)[number]) => ({
                          joId: a.joId,
                          amount: a.amount,
                          description: a.description || '',
                        })
                      )}
                      onSave={async (allocations) => {
                        'use server';
                        await allocateSupplierInvoice(si.id, allocations);
                      }}
                    />
                  )}

                {si.status === 'ALLOCATED' && (
                  <form action={approveSiFormAction}>
                    <button
                      type="submit"
                      className="whitespace-nowrap inline-flex items-center justify-center h-9 px-4 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Approve Invoice (GM)
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
