import { getDemoRole } from '@/lib/actor';
import { listOpexRequests, createOpexRequest, approveOpexRequest } from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';

export default async function ExpensesPage() {
  const role = await getDemoRole();
  const opexRequests = await listOpexRequests(role);
  const canCreate = hasPermission(role, 'opexCreate');
  const canApprove = hasPermission(role, 'opexApprove');

  async function createAction(formData: FormData) {
    'use server';
    const currentRole = (await import('@/lib/actor')).getDemoRole();
    await createOpexRequest(
      {
        category: String(formData.get('category')),
        description: String(formData.get('description')),
        amountCents: Math.round(Number(formData.get('amount')) * 100),
        notes: String(formData.get('notes')),
      },
      await currentRole
    );
    revalidatePath('/expenses');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">OPEX Requests</h1>

      {canCreate && (
        <form
          action={createAction}
          className="bg-white p-4 rounded border border-slate-200 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              name="category"
              placeholder="Category"
              required
              className="border rounded px-3 py-2"
            />
            <input
              name="description"
              placeholder="Description"
              required
              className="border rounded px-3 py-2"
            />
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="Amount (₱)"
              required
              className="border rounded px-3 py-2"
            />
            <input
              name="notes"
              placeholder="Notes"
              className="border rounded px-3 py-2 md:col-span-3"
            />
          </div>
          <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded">
            Submit OPEX
          </button>
        </form>
      )}

      <div className="bg-white rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">Request No</th>
              <th className="text-left px-4 py-2">Category</th>
              <th className="text-left px-4 py-2">Description</th>
              <th className="text-left px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {opexRequests.map((o: any) => (
              <tr key={o.id}>
                <td className="px-4 py-2">{o.request_no}</td>
                <td className="px-4 py-2">{o.category}</td>
                <td className="px-4 py-2">{o.description}</td>
                <td className="px-4 py-2">₱{(o.amount_cents / 100).toFixed(2)}</td>
                <td className="px-4 py-2">{o.status}</td>
                <td className="px-4 py-2">
                  {o.status === 'PENDING_APPROVAL' && canApprove && (
                    <form
                      action={async () => {
                        'use server';
                        const r = (await import('@/lib/actor')).getDemoRole();
                        await approveOpexRequest(o.id, await r);
                        revalidatePath('/expenses');
                        revalidatePath('/dcs');
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
    </div>
  );
}
