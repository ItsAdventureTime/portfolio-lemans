import { getDemoRole } from '@/lib/actor';
import { ApiError, getJobCosting } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { hasPermission } from '@/lib/roles';
import { SectionCard, StatusBadge } from '@/components/ui';
import AccessDenied from '@/components/AccessDenied';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, ArrowLeft, Wrench } from 'lucide-react';
import EndToEndWorkflowVisualizer from '@/components/EndToEndWorkflowVisualizer';

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
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
            </Link>
            <Link
              href="/job-costing"
              className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
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
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Job Costing: #{c.jobOrder.jo_no}
              </h1>
              <StatusBadge status={c.jobOrder.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {c.jobOrder.customer_name} ·{' '}
              <span className="font-mono">{c.jobOrder.vehicle_plate}</span>
            </p>
          </div>
        </div>

        <Link
          href={`/job-orders/${c.jobOrder.jo_no}`}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <Wrench className="w-4 h-4" />
          <span>Open Source Job Order</span>
        </Link>
      </div>

      <EndToEndWorkflowVisualizer role={role} currentStage="COSTING" />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <CostCard label="Estimated Labor" cents={c.totalEstimatedLaborCents} />
        <CostCard label="Estimated Parts" cents={c.totalEstimatedPartsCents} />
        <CostCard label="Recorded Actual Labor" cents={c.actualLaborCostCents} />
        <CostCard label="Recorded Actual Parts" cents={c.actualPartsCostCents} />
        <CostCard label="Allocated Parts" cents={c.partsAllocatedCents} />
        <CostCard label="Total Actual Cost (incl. allocated)" cents={c.totalActualCostCents} />
        <CostCard label="Billed Amount" cents={c.billedAmountCents} />
        <CostCard label="Net Profit" cents={c.netProfitCents} />
        <div className="surface-card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Margin</p>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
            {c.profitMarginPercent.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Billed revenue after actual and allocated costs.
          </p>
        </div>
      </div>

      <section className="surface-card space-y-4 p-5" aria-labelledby="variance-heading">
        <h2
          id="variance-heading"
          className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3"
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
    <SectionCard title={label}>
      <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">{formatPeso(cents)}</p>
    </SectionCard>
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
    <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold text-slate-900 text-sm">{label}</p>
        <p
          className={`text-sm font-extrabold font-mono ${variance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}
        >
          {variance > 0 ? '+' : ''}
          {formatPeso(variance)}
        </p>
      </div>
      <p className="mt-1.5 text-xs text-slate-600">
        Estimated <strong className="font-mono text-slate-800">{formatPeso(estimated)}</strong> ·
        Actual <strong className="font-mono text-slate-800">{formatPeso(actual)}</strong>
      </p>
    </div>
  );
}
