import { getDemoRole } from '@/lib/actor';
import { ApiError, getJobCosting } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { hasPermission } from '@/lib/roles';
import { SectionCard, StatusBadge } from '@/components/ui';
import AccessDenied from '@/components/AccessDenied';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

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
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-rose-900">Unable to load costing data</h2>
          <p className="text-sm text-rose-800">{message}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/job-costing/${id}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
            </Link>
            <Link href="/job-costing" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">
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
      <PageHeader
        title={`Job Costing: ${c.jobOrder.jo_no}`}
        description={`${c.jobOrder.customer_name} · ${c.jobOrder.vehicle_plate}${c.jobOrder.vehicle_make_model ? ` · ${c.jobOrder.vehicle_make_model}` : ''}`}
      >
        <StatusBadge status={c.jobOrder.status} />
      </PageHeader>

      <div className="flex flex-wrap gap-3">
        <Link href={`/job-orders/${c.jobOrder.jo_no}`} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">Open job order</Link>
        <Link href="/job-costing" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">Back to costing</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CostCard label="Estimated Labor" cents={c.totalEstimatedLaborCents} />
        <CostCard label="Estimated Parts" cents={c.totalEstimatedPartsCents} />
        <CostCard label="Actual Labor" cents={c.actualLaborCostCents} />
        <CostCard label="Actual Parts" cents={c.actualPartsCostCents} />
        <CostCard label="Allocated Parts" cents={c.partsAllocatedCents} />
        <CostCard label="Total Actual Cost" cents={c.totalActualCostCents} />
        <CostCard label="Billed Amount" cents={c.billedAmountCents} />
        <CostCard label="Net Profit" cents={c.netProfitCents} />
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Margin</p>
          <p className="text-xl font-semibold">{c.profitMarginPercent.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-500">Billed revenue after actual and allocated costs.</p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="variance-heading">
        <h2 id="variance-heading" className="text-lg font-semibold text-slate-900">Estimate vs. actual</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <VarianceRow label="Labor" estimated={c.totalEstimatedLaborCents} actual={c.actualLaborCostCents} />
          <VarianceRow label="Parts" estimated={c.totalEstimatedPartsCents} actual={c.actualPartsCostCents + c.partsAllocatedCents} />
        </div>
      </section>
    </div>
  );
}

function CostCard({ label, cents }: { label: string; cents: number }) {
  return (
    <SectionCard title={label}>
      <p className="text-xl font-semibold">{formatPeso(cents)}</p>
    </SectionCard>
  );
}

function VarianceRow({ label, estimated, actual }: { label: string; estimated: number; actual: number }) {
  const variance = actual - estimated;
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-slate-900">{label}</p>
        <p className={`text-sm font-semibold ${variance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{variance > 0 ? '+' : ''}{formatPeso(variance)}</p>
      </div>
      <p className="mt-1 text-sm text-slate-600">Estimated {formatPeso(estimated)} · Actual {formatPeso(actual)}</p>
    </div>
  );
}
