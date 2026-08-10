import { getDemoRole } from '@/lib/actor';
import {
  listQuotations,
  createSalesQuotation,
  approveQuotation,
  rejectQuotation,
  convertQuotation,
} from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';

export default async function QuotationsPage() {
  const role = await getDemoRole();
  const quotes = await listQuotations(role);
  const canCreate = hasPermission(role, 'salesQuotationCreate');
  const canApprove = hasPermission(role, 'quoteApprove');
  const canConvert = hasPermission(role, 'quoteConvert');

  async function createAction(formData: FormData) {
    'use server';
    const currentRole = (await import('@/lib/actor')).getDemoRole();
    const items = JSON.parse(String(formData.get('items') || '[]'));
    await createSalesQuotation(
      {
        customerId: String(formData.get('customerId')),
        vehicleId: String(formData.get('vehicleId')),
        advisor: String(formData.get('advisor')),
        items,
      },
      await currentRole
    );
    revalidatePath('/quotations');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sales Quotations</h1>

      {canCreate && (
        <form
          action={createAction}
          className="bg-white p-4 rounded border border-slate-200 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              name="customerId"
              placeholder="Customer ID"
              required
              className="border rounded px-3 py-2"
            />
            <input
              name="vehicleId"
              placeholder="Vehicle ID"
              required
              className="border rounded px-3 py-2"
            />
            <input
              name="advisor"
              placeholder="Advisor"
              required
              className="border rounded px-3 py-2"
            />
            <textarea
              name="items"
              placeholder='[{"itemType":"LABOR","description":"...","quantity":1,"unitPriceCents":0,"discountCents":0}]'
              className="border rounded px-3 py-2 md:col-span-3"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-hover"
          >
            Create Quotation
          </button>
        </form>
      )}

      <div className="bg-white rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">Quote No</th>
              <th className="text-left px-4 py-2">Customer</th>
              <th className="text-left px-4 py-2">Vehicle</th>
              <th className="text-left px-4 py-2">Net Total</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {quotes.map((q: any) => (
              <tr key={q.id}>
                <td className="px-4 py-2">{q.quote_no}</td>
                <td className="px-4 py-2">{q.customer_name}</td>
                <td className="px-4 py-2">{q.vehicle_plate}</td>
                <td className="px-4 py-2">₱{(q.net_total_cents / 100).toFixed(2)}</td>
                <td className="px-4 py-2">{q.status}</td>
                <td className="px-4 py-2 flex gap-2">
                  {q.status === 'DRAFT' && canApprove && (
                    <form
                      action={async () => {
                        'use server';
                        const r = (await import('@/lib/actor')).getDemoRole();
                        await approveQuotation(q.id, await r);
                        revalidatePath('/quotations');
                      }}
                    >
                      <button className="text-xs bg-slate-100 px-2 py-1 rounded">Approve</button>
                    </form>
                  )}
                  {q.status === 'DRAFT' && canApprove && (
                    <form
                      action={async () => {
                        'use server';
                        const r = (await import('@/lib/actor')).getDemoRole();
                        await rejectQuotation(q.id, await r);
                        revalidatePath('/quotations');
                      }}
                    >
                      <button className="text-xs bg-slate-100 px-2 py-1 rounded">Reject</button>
                    </form>
                  )}
                  {q.status === 'APPROVED' && canConvert && (
                    <form
                      action={async () => {
                        'use server';
                        const r = (await import('@/lib/actor')).getDemoRole();
                        await convertQuotation(q.id, await r);
                        revalidatePath('/quotations');
                        revalidatePath('/job-orders');
                      }}
                    >
                      <button className="text-xs bg-brand-primary text-white px-2 py-1 rounded">
                        Convert to JO
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
