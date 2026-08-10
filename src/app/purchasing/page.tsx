import { getDemoRole } from '@/lib/actor';
import {
  listPurchaseRequests,
  listSupplierInvoices,
  createPurchaseRequest,
  createPurchaseRequestFromJO,
  approvePurchaseRequest,
  createSupplierInvoice,
  allocateSupplierInvoice,
  approveSupplierInvoice,
} from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';

export default async function PurchasingPage() {
  const role = await getDemoRole();
  const [purchaseRequests, supplierInvoices] = await Promise.all([
    listPurchaseRequests(role),
    listSupplierInvoices(role),
  ]);
  const canApprovePR = hasPermission(role, 'prApprove');
  const canCreateSI = hasPermission(role, 'supplierInvoiceCreate');
  const canAllocate = hasPermission(role, 'supplierInvoiceAllocate');
  const canApproveSI = hasPermission(role, 'supplierInvoiceApprove');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Purchasing</h1>

      <section className="bg-white rounded border border-slate-200 p-4">
        <h2 className="text-lg font-semibold mb-3">Purchase Requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2">PR No</th>
                <th className="text-left px-4 py-2">Supplier</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {purchaseRequests.map((pr: any) => (
                <tr key={pr.id}>
                  <td className="px-4 py-2">{pr.pr_no}</td>
                  <td className="px-4 py-2">{pr.supplier || '—'}</td>
                  <td className="px-4 py-2">{pr.status}</td>
                  <td className="px-4 py-2">
                    {pr.status === 'PENDING_APPROVAL' && canApprovePR && (
                      <form
                        action={async () => {
                          'use server';
                          const r = (await import('@/lib/actor')).getDemoRole();
                          await approvePurchaseRequest(pr.id, await r);
                          revalidatePath('/purchasing');
                        }}
                      >
                        <button className="text-xs bg-brand-primary text-white px-2 py-1 rounded">
                          Approve
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded border border-slate-200 p-4">
        <h2 className="text-lg font-semibold mb-3">Supplier Invoices</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2">SI No</th>
                <th className="text-left px-4 py-2">Supplier</th>
                <th className="text-left px-4 py-2">Total</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {supplierInvoices.map((si: any) => (
                <tr key={si.id}>
                  <td className="px-4 py-2">{si.si_no}</td>
                  <td className="px-4 py-2">{si.supplier || '—'}</td>
                  <td className="px-4 py-2">₱{(si.total_amount_cents / 100).toFixed(2)}</td>
                  <td className="px-4 py-2">{si.status}</td>
                  <td className="px-4 py-2 flex gap-2">
                    {si.status === 'DRAFT' && canAllocate && (
                      <form
                        action={async (formData: FormData) => {
                          'use server';
                          const r = (await import('@/lib/actor')).getDemoRole();
                          const allocations = JSON.parse(
                            String(formData.get('allocations') || '[]')
                          );
                          await allocateSupplierInvoice(si.id, allocations, await r);
                          revalidatePath('/purchasing');
                        }}
                      >
                        <input
                          name="allocations"
                          placeholder='[{"joId":"...","amountCents":0}]'
                          className="border rounded px-2 py-1 text-xs w-48"
                        />
                        <button className="text-xs bg-slate-100 px-2 py-1 rounded">Allocate</button>
                      </form>
                    )}
                    {si.status === 'ALLOCATED' && canApproveSI && (
                      <form
                        action={async () => {
                          'use server';
                          const r = (await import('@/lib/actor')).getDemoRole();
                          await approveSupplierInvoice(si.id, await r);
                          revalidatePath('/purchasing');
                        }}
                      >
                        <button className="text-xs bg-brand-primary text-white px-2 py-1 rounded">
                          Approve
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
