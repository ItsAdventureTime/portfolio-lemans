import { getDemoRole } from '@/lib/actor';
import { ApiError, getJobCosting } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { hasPermission } from '@/lib/roles';
import { StatusBadge } from '@/components/ui';
import AccessDenied from '@/components/AccessDenied';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, ArrowLeft, Wrench } from 'lucide-react';

export default async function JobCostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getDemoRole();
  if (!hasPermission(role, 'viewJobCosting')) {
    return <AccessDenied role={role} requiredCapability="viewJobCosting" />;
  }
  let data;
  try {
    data = await getJobCosting(id, role);
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "We couldn't load this costing sheet right now. Check the connection and try again.";
    return (
      <div className="max-w-2xl space-y-6" role="alert" aria-live="assertive">
        <h1 className="text-2xl font-semibold">Job Costing</h1>
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-6">
          <h2 className="text-lg font-semibold text-rose-900">Unable to load costing data</h2>
          <p className="text-sm text-rose-800">{message}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/job-costing/${id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-medium text-white hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
            </Link>
            <Link
              href="/job-costing"
              className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              Back to job costing
            </Link>
          </div>
        </div>
      </div>
    );
  }
  if (!data.jobOrder) return notFound();
  const c = data;

  return (
    <div className="max-w-screen-lg space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/job-costing"
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Back to Job Costing list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Job Costing: #{c.jobOrder.jo_no}
              </h1>
              <StatusBadge status={c.jobOrder.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {c.jobOrder.customer_name} ·{' '}
              <span className="font-mono">{c.jobOrder.vehicle_plate}</span>
            </p>
          </div>
        </div>

        <Link
          href={`/job-orders/${c.jobOrder.jo_no}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <Wrench className="w-4 h-4" />
          <span>Open Source Job Order</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <CostCard label="Estimated Labor" cents={c.totalEstimatedLaborCents} />
        <CostCard label="Estimated Parts" cents={c.totalEstimatedPartsCents} />
        <CostCard label="Recorded Actual Labor" cents={c.actualLaborCostCents} />
        <CostCard label="Recorded Actual Parts" cents={c.actualPartsCostCents} />
        <CostCard label="Allocated Parts" cents={c.partsAllocatedCents} />
        <CostCard label="Total Actual Cost (incl. allocated)" cents={c.totalActualCostCents} />
        <CostCard label="Billed Amount" cents={c.billedAmountCents} />
        <CostCard label="Net Profit" cents={c.netProfitCents} />
        <div className="surface-card-muted p-5">
          <p className="text-sm font-medium text-slate-500">Margin</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
            {c.profitMarginPercent.toFixed(1)}%
          </p>
          <p className="mt-2 text-sm leading-5 text-slate-500">
            Billed revenue after actual and allocated costs.
          </p>
        </div>
      </div>

      <section className="surface-card space-y-5 p-5 sm:p-6" aria-labelledby="variance-heading">
        <h2
          id="variance-heading"
          className="border-b border-slate-200 pb-4 text-lg font-semibold text-slate-900"
        >
          Estimate vs. Actual Variance Analysis
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <VarianceRow
            label="Labor"
            estimated={c.totalEstimatedLaborCents}
            actual={c.actualLaborCostCents}
          />
          <VarianceRow
            label="Parts (incl. allocated)"
            estimated={c.totalEstimatedPartsCents}
            actual={c.actualPartsCostCents + c.partsAllocatedCents}
          />
        </div>
      </section>
    </div>
  );
}

function CostCard({ label, cents }: { label: string; cents: number }) {
  return (
    <article className="surface-card-muted flex min-h-[9.5rem] flex-col p-5">
      <p className="text-base font-medium text-slate-600">{label}</p>
      <p className="mt-auto pt-6 font-mono text-xl font-semibold tabular-nums text-slate-900">
        {formatPeso(cents)}
      </p>
    </article>
  );
}

function VarianceRow({
  label,
  estimated,
  actual,
}: {
  label: string;
  estimated: number;
  actual: number;
}) {
  const variance = actual - estimated;
  return (
    <div className="surface-card-inset p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-base font-medium text-slate-900">{label}</p>
        <p
          className={`font-mono text-base font-semibold tabular-nums ${variance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}
        >
          {variance > 0 ? '+' : ''}
          {formatPeso(variance)}
        </p>
      </div>
      <p className="mt-2 text-sm leading-5 text-slate-600">
        Estimated{' '}
        <span className="font-mono font-medium text-slate-800">{formatPeso(estimated)}</span> ·
        Actual <span className="font-mono font-medium text-slate-800">{formatPeso(actual)}</span>
      </p>
    </div>
  );
}
