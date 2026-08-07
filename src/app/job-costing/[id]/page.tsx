import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getJobOrderActuals, calculateJobCosting } from '@/lib/costing';

export default async function JobCostingPage({ params }: { params: { id: string } }) {
  const jo = await db.jobOrder.findUnique({
    where: { joNo: params.id },
    include: {
      customer: true,
      vehicle: true,
      items: true,
      invoiceAllocations: true,
      serviceInvoice: true,
    },
  });
  if (!jo) notFound();

  const { partsCost } = await getJobOrderActuals(jo.id);
  const costing = calculateJobCosting({
    billedAmount: jo.billedAmount || jo.items.reduce((sum, i) => sum + i.netAmount, 0),
    actualLaborCost: jo.actualLaborCost,
    actualPartsCost: jo.actualPartsCost + partsCost,
    allocatedExpenses: 0,
    isVatInclusive: false,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Job Cost Sheet: {jo.joNo}</h2>
            <p className="text-sm text-slate-500">
              {jo.customer.name} • {jo.vehicle.makeModel} ({jo.vehicle.plateNo})
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {jo.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-sm font-bold text-slate-600">Billed Amount</span>
          <div className="text-3xl lg:text-4xl font-extrabold text-slate-900">
            ₱
            {costing.netProfit > 0
              ? jo.billedAmount.toFixed(2)
              : jo.items.reduce((sum, i) => sum + i.netAmount, 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-sm font-bold text-slate-600">Total Actual Cost</span>
          <div className="text-3xl lg:text-4xl font-extrabold text-slate-900">
            ₱{costing.totalActualCost.toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-sm font-bold text-slate-600">Net Profit / Margin</span>
          <div className="text-3xl lg:text-4xl font-extrabold text-emerald-600">
            ₱{costing.netProfit.toFixed(2)} ({costing.profitMarginPercent.toFixed(1)}%)
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-bold text-slate-900">Cost Allocations</h3>
        </div>
        <div className="p-5">
          {jo.invoiceAllocations.length === 0 ? (
            <p className="text-base text-slate-500">No supplier invoice allocations yet.</p>
          ) : (
            <ul className="space-y-2">
              {jo.invoiceAllocations.map((alloc) => (
                <li key={alloc.id} className="flex justify-between text-base">
                  <span className="text-slate-700">
                    {alloc.description || 'Supplier invoice allocation'}
                  </span>
                  <span className="font-mono font-semibold">₱{alloc.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
