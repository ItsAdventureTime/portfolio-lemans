import { getDemoRole } from '@/lib/actor';
import {
  getJobOrder,
  listJobOrderItems,
  listJobOrderEvents,
  assignTechnician,
  changeJobOrderStatus,
  addJobOrderEvent,
} from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { hasPermission } from '@/lib/roles';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const STATUS_OPTIONS = [
  'DRAFT',
  'APPROVED',
  'IN_PROGRESS',
  'PARTS_PENDING',
  'COMPLETED',
  'BILLED',
  'CLOSED',
];

export default async function JobOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getDemoRole();
  const [jo, items, events] = await Promise.all([
    getJobOrder(id, role),
    listJobOrderItems(id, role),
    listJobOrderEvents(id, role),
  ]);
  if (!jo) return notFound();
  const canManage = hasPermission(role, 'joChangeStatus');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Job Order {jo.jo_no}</h1>
        <span className="px-3 py-1 rounded bg-slate-100 text-sm font-medium">{jo.status}</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 text-sm space-y-2">
        <p>
          <strong>Customer:</strong> {jo.customer_name}
        </p>
        <p>
          <strong>Vehicle:</strong> {jo.vehicle_plate} — {jo.vehicle_make_model}
        </p>
        <p>
          <strong>Advisor:</strong> {jo.advisor}
        </p>
        <p>
          <strong>Technician:</strong> {jo.technician || 'Unassigned'}
        </p>
      </div>

      {canManage && (
        <div className="bg-white p-4 rounded border border-slate-200 space-y-4">
          <form
            action={async (formData: FormData) => {
              'use server';
              const r = (await import('@/lib/actor')).getDemoRole();
              await assignTechnician(id, String(formData.get('technician')), await r);
              revalidatePath(`/job-orders/${id}`);
            }}
            className="flex gap-2"
          >
            <input
              name="technician"
              placeholder="Technician name"
              className="border rounded px-3 py-2 flex-1"
            />
            <button className="bg-brand-primary text-white px-4 py-2 rounded">Assign</button>
          </form>

          <form
            action={async (formData: FormData) => {
              'use server';
              const r = (await import('@/lib/actor')).getDemoRole();
              await changeJobOrderStatus(id, String(formData.get('nextStatus')), await r);
              revalidatePath(`/job-orders/${id}`);
            }}
            className="flex gap-2"
          >
            <select name="nextStatus" className="border rounded px-3 py-2 flex-1">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button className="bg-brand-primary text-white px-4 py-2 rounded">Change Status</button>
          </form>

          <form
            action={async (formData: FormData) => {
              'use server';
              const r = (await import('@/lib/actor')).getDemoRole();
              await addJobOrderEvent(
                id,
                {
                  eventType: String(formData.get('eventType')),
                  description: String(formData.get('description')),
                },
                await r
              );
              revalidatePath(`/job-orders/${id}`);
            }}
            className="flex gap-2"
          >
            <input name="eventType" placeholder="Event type" className="border rounded px-3 py-2" />
            <input
              name="description"
              placeholder="Description"
              className="border rounded px-3 py-2 flex-1"
            />
            <button className="bg-slate-700 text-white px-4 py-2 rounded">Add Event</button>
          </form>
        </div>
      )}

      <h2 className="text-lg font-semibold">Items</h2>
      <div className="bg-white rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Description</th>
              <th className="text-left px-4 py-2">Qty</th>
              <th className="text-left px-4 py-2">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((it: any) => (
              <tr key={it.id}>
                <td className="px-4 py-2">{it.item_type}</td>
                <td className="px-4 py-2">{it.description}</td>
                <td className="px-4 py-2">{it.quantity}</td>
                <td className="px-4 py-2">{formatPeso(it.net_amount_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold">Timeline</h2>
      <div className="bg-white rounded border border-slate-200 divide-y">
        {events.map((e: any) => (
          <div key={e.id} className="px-4 py-3 text-sm">
            <p className="font-medium">{e.event_type}</p>
            <p className="text-slate-500">{e.description}</p>
            <p className="text-xs text-slate-400">{e.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
