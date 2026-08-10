import { getDemoRole } from '@/lib/actor';
import { getJobCosting } from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { notFound } from 'next/navigation';

export default async function JobCostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getDemoRole();
  if (!hasPermission(role, 'viewJobCosting')) {
    return <div className="p-6 text-red-600">Access restricted.</div>;
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
    <div className="bg-white p-4 rounded border border-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-semibold">₱{(cents / 100).toFixed(2)}</p>
    </div>
  );
}
