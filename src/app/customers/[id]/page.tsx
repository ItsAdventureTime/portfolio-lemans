import { getDemoRole } from '@/lib/actor';
import { getCustomer, listCustomerServiceHistory, listVehiclesByCustomer } from '@/lib/api';
import { DataTable, StatusBadge } from '@/components/ui';
import { formatPeso } from '@/lib/money';
import type { JobOrder, Vehicle } from '@/lib/types';
import { canAccessModule, hasPermission } from '@/lib/roles';
import AccessDenied from '@/components/AccessDenied';
import Link from 'next/link';
import { ArrowLeft, User, Car, Clock, Wrench } from 'lucide-react';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getDemoRole();
  if (!canAccessModule(role, 'customers')) {
    return <AccessDenied role={role} requiredCapability="customerCreate" />;
  }
  const canViewJobOrders = canAccessModule(role, 'jobOrders');
  const [customer, vehicles, serviceHistory] = await Promise.all([
    getCustomer(id, role),
    listVehiclesByCustomer(id, role),
    listCustomerServiceHistory(id, role),
  ]);

  return (
    <div className="space-y-6">
      {/* Header & Back Link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Back to Customers list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {customer.name}
            </h1>
            <p className="text-xs text-slate-500">Customer Account #{customer.customer_no}</p>
          </div>
        </div>
        {hasPermission(role, 'salesQuotationCreate') && (
          <Link
            href="/quotations"
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <span>Create Quote for Customer</span>
          </Link>
        )}
      </div>

      {/* Customer Info Card */}
      <div className="surface-card space-y-4 p-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-5 h-5 text-brand-primary" />
          <h2 className="text-base font-bold text-slate-900">Customer Account Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Customer No
            </p>
            <p className="font-bold text-slate-900 mt-0.5">{customer.customer_no}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TIN</p>
            <p className="font-mono text-slate-900 mt-0.5">{customer.tin || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</p>
            <p className="font-medium text-slate-900 mt-0.5">{customer.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</p>
            <p className="font-medium text-slate-900 mt-0.5">{customer.email || '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Billing Address
            </p>
            <p className="font-medium text-slate-900 mt-0.5">{customer.address || '—'}</p>
          </div>
        </div>
      </div>

      {/* Registered Vehicles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-slate-700" />
            <span>Registered Vehicles ({vehicles.length})</span>
          </h2>
        </div>
        <DataTable<Vehicle>
          items={vehicles}
          caption="Customer vehicles"
          emptyTitle="No vehicles registered"
          emptyDescription="This customer does not have any vehicles registered yet."
          columns={[
            {
              key: 'plate',
              header: 'Plate Number',
              render: (v) => (
                <span className="font-mono font-bold text-slate-900">{v.plate_no}</span>
              ),
            },
            {
              key: 'makeModel',
              header: 'Make & Model',
              render: (v) => <span className="font-medium">{v.make_model}</span>,
            },
            { key: 'year', header: 'Year', render: (v) => v.year || '—' },
            { key: 'color', header: 'Color', render: (v) => v.color || '—' },
          ]}
        />
      </div>

      {/* Linked Service History Timeline */}
      <section aria-labelledby="service-history-heading" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2
            id="service-history-heading"
            className="text-lg font-bold text-slate-900 flex items-center gap-2"
          >
            <Clock className="w-5 h-5 text-slate-700" />
            <span>Service history</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {serviceHistory.length} Record{serviceHistory.length === 1 ? '' : 's'}
          </span>
        </div>

        {serviceHistory.length === 0 ? (
          <div className="surface-card p-8 text-center text-sm text-slate-500">
            No service history yet.
          </div>
        ) : (
          <ol className="space-y-4 border-l-2 border-slate-200 pl-5 ml-2">
            {(serviceHistory as JobOrder[]).map((jobOrder) => (
              <li
                key={jobOrder.id}
                className="surface-card relative p-4 transition-colors hover:border-slate-300"
              >
                <span
                  className="absolute -left-[1.65rem] top-5 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-primary"
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {canViewJobOrders ? (
                      <Link
                        href={`/job-orders/${jobOrder.jo_no}`}
                        className="font-bold text-brand-primary hover:text-brand-primary-hover hover:underline text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
                      >
                        {jobOrder.jo_no}
                      </Link>
                    ) : (
                      <span className="font-bold text-slate-800 text-base">{jobOrder.jo_no}</span>
                    )}

                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Plate: <span className="font-mono">{jobOrder.vehicle_plate}</span> ·{' '}
                      {jobOrder.vehicle_make_model || 'Vehicle'}
                    </p>
                  </div>
                  <StatusBadge status={jobOrder.status || 'COMPLETED'} />
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Billed Amount:{' '}
                    <strong className="text-slate-900 font-mono">
                      {formatPeso(jobOrder.billed_amount_cents ?? 0)}
                    </strong>
                  </span>
                  {canViewJobOrders && (
                    <span className="inline-flex items-center gap-1 font-semibold text-brand-primary">
                      <span>View JO Details</span>
                      <Wrench className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
