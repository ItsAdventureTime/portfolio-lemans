import Link from 'next/link';
import { Calculator, RefreshCw, Search } from 'lucide-react';
import { getDemoRole } from '@/lib/actor';
import { ApiError, listJobOrders } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { hasPermission } from '@/lib/roles';
import { DataTable, StatusBadge } from '@/components/ui';
import AccessDenied from '@/components/AccessDenied';
import PageHeader from '@/components/PageHeader';
import type { JobOrder } from '@/lib/types';

export default async function JobCostingIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  const role = await getDemoRole();
  if (!hasPermission(role, 'viewJobCosting')) {
    return <AccessDenied role={role} requiredCapability="viewJobCosting" />;
  }

  let jobOrders: JobOrder[];
  try {
    jobOrders = (await listJobOrders(role)) as JobOrder[];
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "We couldn't load job orders right now. Check the connection and try again.";
    return (
      <div className="max-w-2xl space-y-6" role="alert" aria-live="assertive">
        <PageHeader
          title="Job Costing"
          description="Review estimated and actual costs for each job order."
        />
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-6">
          <h2 className="text-lg font-semibold text-rose-900">Unable to load job orders</h2>
          <p className="text-sm text-rose-800">{message}</p>
          <Link
            href="/job-costing"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
          </Link>
        </div>
      </div>
    );
  }

  const params = (await searchParams) ?? {};
  const query = params.q?.trim().toLowerCase() ?? '';
  const status = params.status?.trim().toUpperCase() ?? '';
  const filtered = jobOrders.filter((jo) => {
    const matchesQuery =
      !query ||
      [jo.jo_no, jo.customer_name, jo.vehicle_plate, jo.technician ?? ''].some((value) =>
        value.toLowerCase().includes(query)
      );
    return matchesQuery && (!status || jo.status.toUpperCase() === status);
  });
  const totals = filtered.reduce(
    (summary, jo) => {
      summary.estimated +=
        (jo.total_estimated_labor_cents ?? 0) + (jo.total_estimated_parts_cents ?? 0);
      summary.actual += (jo.actual_labor_cost_cents ?? 0) + (jo.actual_parts_cost_cents ?? 0);
      summary.billed += jo.billed_amount_cents ?? 0;
      summary.profit += jo.net_profit_cents ?? 0;
      return summary;
    },
    { estimated: 0, actual: 0, billed: 0, profit: 0 }
  );
  const statuses = [...new Set(jobOrders.map((jo) => jo.status))].sort();

  return (
    <div className="max-w-screen-xl space-y-6">
      <PageHeader
        title="Job Costing"
        description="Compare planned costs with recorded spend and billed revenue."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Estimated" cents={totals.estimated} />
        <SummaryCard label="Recorded actual labor + parts" cents={totals.actual} />
        <SummaryCard label="Billed" cents={totals.billed} />
        <SummaryCard label="Net profit" cents={totals.profit} />
      </div>

      <p className="text-sm text-slate-600">
        List actuals and variances include recorded labor and parts costs. Supplier invoice
        allocations appear on each job-cost detail sheet.
      </p>

      <form
        method="get"
        className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
        role="search"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor="job-costing-search" className="text-sm font-semibold text-slate-700">
            Find a job order
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="job-costing-search"
              name="q"
              defaultValue={params.q ?? ''}
              placeholder="JO number, customer, vehicle, or technician"
              className="min-h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            />
          </div>
        </div>
        <div className="space-y-1 sm:w-52">
          <label htmlFor="job-costing-status" className="text-sm font-semibold text-slate-700">
            Status
          </label>
          <select
            id="job-costing-status"
            name="status"
            defaultValue={params.status ?? ''}
            className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          Apply filters
        </button>
        {query || status ? (
          <Link
            href="/job-costing"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <p className="text-sm text-slate-600" role="status" aria-live="polite">
        Showing {filtered.length} of {jobOrders.length} job orders.
      </p>
      <DataTable
        items={filtered}
        caption="Job costing records"
        emptyTitle={
          jobOrders.length === 0 ? 'No job orders available for costing' : 'No matching job orders'
        }
        emptyDescription={
          jobOrders.length === 0
            ? 'Create or convert a job order to make its costing sheet available here.'
            : 'Try a different search or clear the filters to see all job orders.'
        }
        columns={[
          {
            key: 'joNo',
            header: 'JO No',
            render: (jo) => (
              <Link
                href={`/job-costing/${jo.jo_no}`}
                className="-mx-1 inline-flex min-h-11 items-center rounded px-1 text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                <Calculator className="mr-2 h-4 w-4" aria-hidden="true" /> {jo.jo_no}
              </Link>
            ),
          },
          { key: 'customer', header: 'Customer', render: (jo) => jo.customer_name },
          { key: 'vehicle', header: 'Vehicle', render: (jo) => jo.vehicle_plate },
          { key: 'status', header: 'Status', render: (jo) => <StatusBadge status={jo.status} /> },
          {
            key: 'estimated',
            header: 'Estimated',
            render: (jo) =>
              formatPeso(
                (jo.total_estimated_labor_cents ?? 0) + (jo.total_estimated_parts_cents ?? 0)
              ),
          },
          {
            key: 'actual',
            header: 'Recorded actual',
            render: (jo) =>
              formatPeso((jo.actual_labor_cost_cents ?? 0) + (jo.actual_parts_cost_cents ?? 0)),
          },
          {
            key: 'variance',
            header: 'Variance (recorded)',
            render: (jo) => <CostVariance jo={jo} />,
          },
          { key: 'technician', header: 'Technician', render: (jo) => jo.technician || '—' },
        ]}
      />
    </div>
  );
}

function SummaryCard({ label, cents }: { label: string; cents: number }) {
  return (
    <section className="surface-card p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{formatPeso(cents)}</p>
    </section>
  );
}

function CostVariance({ jo }: { jo: JobOrder }) {
  const estimated = (jo.total_estimated_labor_cents ?? 0) + (jo.total_estimated_parts_cents ?? 0);
  const actual = (jo.actual_labor_cost_cents ?? 0) + (jo.actual_parts_cost_cents ?? 0);
  const variance = actual - estimated;
  return (
    <span
      className={variance > 0 ? 'font-semibold text-rose-700' : 'font-semibold text-emerald-700'}
    >
      {variance > 0 ? '+' : ''}
      {formatPeso(variance)}
    </span>
  );
}
