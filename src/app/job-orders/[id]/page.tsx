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
import { canAccessModule, hasPermission } from '@/lib/roles';
import AccessDenied from '@/components/AccessDenied';
import { DataTable, StatusBadge, FormField } from '@/components/ui';
import type { JobOrderItem, JobOrderEvent } from '@/lib/types';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import StatusWorkflowStepper from '@/components/status-workflow-stepper';
import EndToEndWorkflowVisualizer from '@/components/EndToEndWorkflowVisualizer';
import {
  ArrowLeft,
  Calculator,
  UserCheck,
  RefreshCw,
  PlusCircle,
  Wrench,
  Clock,
} from 'lucide-react';

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
  if (!canAccessModule(role, 'jobOrders')) {
    return <AccessDenied role={role} requiredCapability="joChangeStatus" />;
  }
  const [jo, items, events] = await Promise.all([
    getJobOrder(id, role),
    listJobOrderItems(id, role),
    listJobOrderEvents(id, role),
  ]);
  if (!jo) return notFound();
  const canManage = hasPermission(role, 'joChangeStatus');
  const canViewCosting = hasPermission(role, 'viewJobCosting');

  return (
    <div className="space-y-6">
      {/* Top Header & Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/job-orders"
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Back to Job Orders list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Job Order {jo.jo_no}
              </h1>
              <StatusBadge status={jo.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Advisor: <span className="font-semibold text-slate-700">{jo.advisor}</span> ·
              Technician:{' '}
              <span className="font-semibold text-slate-700">{jo.technician || 'Unassigned'}</span>
            </p>
          </div>
        </div>

        {canViewCosting && (
          <Link
            href={`/job-costing/${jo.jo_no}`}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary shadow-sm"
          >
            <Calculator className="w-4 h-4" />
            <span>View Job Costing Sheet</span>
          </Link>
        )}
      </div>

      {/* Stage 3 Active Visualizer */}
      <EndToEndWorkflowVisualizer role={role} currentStage="JOB_ORDER" />

      {/* Job Order Status Stepper */}
      <div className="surface-card space-y-3 p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Job Order Operational Lifecycle
        </h2>
        <StatusWorkflowStepper status={jo.status} />
      </div>

      {/* Primary Details Summary */}
      <div className="surface-card space-y-4 p-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Wrench className="w-5 h-5 text-brand-primary" />
          <h2 className="text-base font-bold text-slate-900">Vehicle & Customer Context</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Customer Name
            </p>
            <p className="font-bold text-slate-900 mt-0.5">{jo.customer_name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vehicle Plate
            </p>
            <p className="font-mono font-bold text-slate-900 mt-0.5">{jo.vehicle_plate}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Make / Model
            </p>
            <p className="font-medium text-slate-900 mt-0.5">{jo.vehicle_make_model || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Technician Assigned
            </p>
            <p className="font-semibold text-slate-900 mt-0.5">{jo.technician || 'Unassigned'}</p>
          </div>
        </div>
      </div>

      {/* Management Actions */}
      {canManage && (
        <div className="surface-card space-y-5 p-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Operational Controls
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Assign Tech */}
            <form
              action={async (formData: FormData) => {
                'use server';
                const r = (await import('@/lib/actor')).getDemoRole();
                await assignTechnician(id, String(formData.get('technician')), await r);
                revalidatePath(`/job-orders/${id}`);
              }}
              className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <UserCheck className="w-4 h-4 text-brand-primary" />
                <span>Assign Technician</span>
              </div>
              <FormField
                label=""
                name="technician"
                placeholder="Technician Name"
                defaultValue={jo.technician || ''}
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center min-h-11 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                Save Assignment
              </button>
            </form>

            {/* Change Status */}
            <form
              action={async (formData: FormData) => {
                'use server';
                const r = (await import('@/lib/actor')).getDemoRole();
                await changeJobOrderStatus(id, String(formData.get('nextStatus')), await r);
                revalidatePath(`/job-orders/${id}`);
              }}
              className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <RefreshCw className="w-4 h-4 text-brand-primary" />
                <span>Update Status</span>
              </div>
              <div className="space-y-1">
                <select
                  id="nextStatus"
                  name="nextStatus"
                  defaultValue={jo.status}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-brand-primary"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center min-h-11 px-4 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-hover transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                Change Status
              </button>
            </form>

            {/* Add Event */}
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
              className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <PlusCircle className="w-4 h-4 text-brand-primary" />
                <span>Record Timeline Event</span>
              </div>
              <FormField label="" name="eventType" placeholder="Event Type (e.g. INSPECTION)" />
              <FormField label="" name="description" placeholder="Description / Notes" />
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-700 px-4 text-xs font-semibold text-white transition-colors hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                Add Log Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Itemized Labor & Parts Table */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Estimated Line Items ({items.length})</h2>
        <DataTable<JobOrderItem>
          items={items}
          caption="Job order line items"
          emptyTitle="No line items"
          emptyDescription="This job order does not have any estimated line items."
          columns={[
            {
              key: 'type',
              header: 'Type',
              render: (it) => (
                <span className="text-xs font-semibold uppercase bg-slate-100 px-2 py-1 rounded text-slate-700">
                  {it.item_type}
                </span>
              ),
            },
            {
              key: 'description',
              header: 'Description',
              render: (it) => <span className="font-medium text-slate-900">{it.description}</span>,
            },
            {
              key: 'qty',
              header: 'Qty',
              render: (it) => <span className="tabular-nums font-semibold">{it.quantity}</span>,
            },
            {
              key: 'net',
              header: 'Net Amount',
              render: (it) => (
                <span className="font-mono font-semibold text-slate-900">
                  {formatPeso(it.net_amount_cents)}
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Timeline Events */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-700" />
          <span>Audit Event Timeline ({events.length})</span>
        </h2>
        <DataTable<JobOrderEvent>
          items={events}
          caption="Job order timeline events"
          emptyTitle="No timeline events"
          emptyDescription="No timeline events recorded for this job order."
          columns={[
            {
              key: 'type',
              header: 'Event Type',
              render: (e) => <span className="font-bold text-slate-900">{e.event_type}</span>,
            },
            {
              key: 'description',
              header: 'Description / Audit',
              render: (e) => e.description || '—',
            },
            {
              key: 'createdAt',
              header: 'Timestamp',
              render: (e) => (
                <span className="text-xs text-slate-500 font-mono">{e.created_at}</span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
