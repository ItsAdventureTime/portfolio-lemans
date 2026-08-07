import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { assignTechnician, transitionJobOrderStatus } from '@/lib/actions/job-orders';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/roles';

const STATUS_OPTIONS = [
  'DRAFT',
  'APPROVED',
  'IN_PROGRESS',
  'PARTS_PENDING',
  'COMPLETED',
  'BILLED',
  'CLOSED',
];

export default async function JobOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: headers() });
  const jo = await db.jobOrder.findUnique({
    where: { joNo: params.id },
    include: {
      customer: true,
      vehicle: true,
      items: true,
      events: { orderBy: { createdAt: 'desc' } },
      serviceInvoice: true,
      invoiceAllocations: true,
    },
  });
  if (!jo) notFound();

  const canManage = hasPermission(session?.user.role, 'joChangeStatus');
  const jobOrder = jo!;

  async function assignFormAction(formData: FormData) {
    'use server';
    const technician = formData.get('technician') as string;
    await assignTechnician(jobOrder.id, technician);
  }

  async function statusFormAction(formData: FormData) {
    'use server';
    const nextStatus = formData.get('nextStatus') as string;
    await transitionJobOrderStatus(jobOrder.id, nextStatus as import('@prisma/client').JOStatus);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-900">{jo.joNo}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {jo.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {jo.customer.name} • {jo.vehicle.makeModel} ({jo.vehicle.plateNo})
            </p>
          </div>
          <div className="text-sm font-bold font-mono text-slate-900">
            ₱{jo.billedAmount.toFixed(2)}
          </div>
        </div>

        {canManage && (
          <div className="border-t border-slate-200 pt-4 space-y-4">
            <form action={assignFormAction} className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-700">Technician</label>
                <input
                  name="technician"
                  defaultValue={jo.technician ?? ''}
                  placeholder="Assign technician"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Assign
              </button>
            </form>

            <form action={statusFormAction} className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-700">Status</label>
                <select
                  name="nextStatus"
                  defaultValue={jo.status}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
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
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-semibold"
              >
                Update
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Event Timeline</h3>
        </div>
        <div className="p-5 space-y-3">
          {jo.events.map((event) => (
            <div key={event.id} className="flex items-start space-x-3">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-brand-primary" />
              <div>
                <p className="text-xs font-semibold text-slate-800">{event.eventType}</p>
                <p className="text-xs text-slate-500">{event.description}</p>
                <p className="text-[11px] text-slate-400">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
