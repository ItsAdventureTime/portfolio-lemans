import { getDemoRole } from '@/lib/actor';
import { getJobCosting } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { hasPermission } from '@/lib/roles';
import { SectionCard } from '@/components/ui';
import AccessDenied from '@/components/AccessDenied';
import { notFound } from 'next/navigation';

export default async function JobCostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getDemoRole();
  if (!hasPermission(role, 'viewJobCosting')) {
    return <AccessDenied role={role} requiredCapability="viewJobCosting" />;
  }
  const data = await getJobCosting(id, role);
  if (!data.jobOrder) return notFound();
  const c = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Job Costing: {c.jobOrder.jo_no}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CostCard label="Estimated Labor" cents={c.totalEstimatedLaborCents} />
        <CostCard label="Estimated Parts" cents={c.totalEstimatedPartsCents} />
        <CostCard label="Actual Labor" cents={c.actualLaborCostCents} />
        <CostCard label="Actual Parts" cents={c.actualPartsCostCents} />
        <CostCard label="Allocated Expenses" cents={c.partsAllocatedCents} />
        <CostCard label="Total Actual Cost" cents={c.totalActualCostCents} />
        <CostCard label="Billed Amount" cents={c.billedAmountCents} />
        <CostCard label="Net Profit" cents={c.netProfitCents} />
        <div className="bg-white p-4 rounded border border-slate-200">
          <p className="text-sm text-slate-500">Margin</p>
          <p className="text-xl font-semibold">{c.profitMarginPercent.toFixed(1)}%</p>
        </div>
      </div>
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
