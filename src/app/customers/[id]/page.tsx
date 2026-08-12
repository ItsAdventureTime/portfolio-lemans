import { getDemoRole } from '@/lib/actor';
import { getCustomer, listCustomerServiceHistory, listVehiclesByCustomer } from '@/lib/api';
import { DataTable, StatusBadge } from '@/components/ui';
import { formatPeso } from '@/lib/money';
import type { JobOrder, Vehicle } from '@/lib/types';
import Link from 'next/link';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getDemoRole();
  const [customer, vehicles, serviceHistory] = await Promise.all([
    getCustomer(id, role),
    listVehiclesByCustomer(id, role),
    listCustomerServiceHistory(id, role),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{customer.name}</h1>
      <div className="bg-white p-4 rounded border border-slate-200 space-y-2 text-sm">
        <p>
          <span className="font-medium">Customer No:</span> {customer.customer_no}
        </p>
        <p>
          <span className="font-medium">TIN:</span> {customer.tin}
        </p>
        <p>
          <span className="font-medium">Address:</span> {customer.address}
        </p>
        <p>
          <span className="font-medium">Phone:</span> {customer.phone}
        </p>
        <p>
          <span className="font-medium">Email:</span> {customer.email}
        </p>
      </div>
      <h2 className="text-lg font-semibold">Vehicles</h2>
      <DataTable<Vehicle>
        items={vehicles}
        caption="Customer vehicles"
        emptyTitle="No vehicles"
        emptyDescription="This customer has no registered vehicles."
        columns={[
          { key: 'plate', header: 'Plate', render: (v) => v.plate_no },
          { key: 'makeModel', header: 'Make/Model', render: (v) => v.make_model },
          { key: 'year', header: 'Year', render: (v) => v.year || '—' },
          { key: 'color', header: 'Color', render: (v) => v.color || '—' },
        ]}
      />
      <section aria-labelledby="service-history-heading" className="space-y-3">
        <h2 id="service-history-heading" className="text-lg font-semibold">
          Service history
        </h2>
        {serviceHistory.length === 0 ? (
          <div className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No service history yet.
          </div>
        ) : (
          <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
            {(serviceHistory as JobOrder[]).map((jobOrder) => (
              <li
                key={jobOrder.id}
                className="relative rounded border border-slate-200 bg-white p-4"
              >
                <span
                  className="absolute -left-[1.4rem] top-5 h-3 w-3 rounded-full bg-brand-primary"
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/job-orders/${jobOrder.jo_no}`}
                      className="font-semibold text-brand-primary hover:underline"
                    >
                      {jobOrder.jo_no}
                    </Link>
                    <p className="text-sm text-slate-600">
                      {jobOrder.vehicle_plate} · {jobOrder.vehicle_make_model || 'Vehicle'}
                    </p>
                  </div>
                  <StatusBadge status={jobOrder.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Recorded billed amount: {formatPeso(jobOrder.billed_amount_cents ?? 0)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
