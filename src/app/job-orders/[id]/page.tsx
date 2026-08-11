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
import { DataTable, StatusBadge, FormField } from '@/components/ui';
import type { JobOrderItem, JobOrderEvent } from '@/lib/types';
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
        <StatusBadge status={jo.status} />
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
            className="flex flex-wrap items-end gap-2"
          >
            <FormField
              label="Technician"
              name="technician"
              placeholder="Technician name"
              className="flex-1 min-w-[200px]"
            />
            <button className="inline-flex items-center justify-center h-12 px-4 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-hover transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">
              Assign
            </button>
          </form>

          <form
            action={async (formData: FormData) => {
              'use server';
              const r = (await import('@/lib/actor')).getDemoRole();
              await changeJobOrderStatus(id, String(formData.get('nextStatus')), await r);
              revalidatePath(`/job-orders/${id}`);
            }}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="flex-1 min-w-[200px] space-y-1">
              <label htmlFor="nextStatus" className="text-sm font-semibold text-slate-700">
                Next status
              </label>
              <select
                id="nextStatus"
                name="nextStatus"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <button className="inline-flex items-center justify-center h-12 px-4 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-hover transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">
              Change Status
            </button>
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
            className="flex flex-wrap items-end gap-2"
          >
            <FormField
              label="Event type"
              name="eventType"
              placeholder="Event type"
              className="w-40"
            />
            <FormField
              label="Description"
              name="description"
              placeholder="Description"
              className="flex-1 min-w-[200px]"
            />
            <button className="inline-flex items-center justify-center h-12 px-4 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2">
              Add Event
            </button>
          </form>
        </div>
      )}

      <h2 className="text-lg font-semibold">Items</h2>
      <DataTable<JobOrderItem>
        items={items}
        caption="Job order line items"
        emptyTitle="No items"
        emptyDescription="This job order has no line items."
        columns={[
          { key: 'type', header: 'Type', render: (it) => it.item_type },
          { key: 'description', header: 'Description', render: (it) => it.description },
          { key: 'qty', header: 'Qty', render: (it) => it.quantity },
          { key: 'net', header: 'Net', render: (it) => formatPeso(it.net_amount_cents) },
        ]}
      />

      <h2 className="text-lg font-semibold">Timeline</h2>
      <DataTable<JobOrderEvent>
        items={events}
        caption="Job order timeline events"
        emptyTitle="No events"
        emptyDescription="No timeline events recorded for this job order."
        columns={[
          { key: 'type', header: 'Type', render: (e) => e.event_type },
          { key: 'description', header: 'Description', render: (e) => e.description || '—' },
          { key: 'createdAt', header: 'Created', render: (e) => e.created_at },
        ]}
      />
    </div>
  );
}
