import Link from 'next/link';
import { getDemoRole } from '@/lib/actor';
import { getDashboard } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { StatusBadge } from '@/components/ui';

export default async function DashboardOverview() {
  const role = await getDemoRole();
  const data = await getDashboard(role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Operations Overview</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Job Orders" value={data.counts.activeJobOrders} />
        <StatCard label="Parts Pending" value={data.counts.partsPendingJobOrders} />
        <StatCard label="Completed" value={data.counts.completedJobOrders} />
        <StatCard label="Pending PRs" value={data.counts.pendingPurchaseRequests} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MoneyCard label="Total Billed" value={formatPeso(data.financials.billedCents)} />
        <MoneyCard label="Total Actual Cost" value={formatPeso(data.financials.actualCostCents)} />
        <MoneyCard label="Net Profit" value={formatPeso(data.financials.netProfitCents)} />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="font-medium text-slate-900">Recent Job Orders</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {data.recentJobOrders.map(
            (jo: {
              id: string;
              jo_no: string;
              customer_name: string;
              vehicle_plate: string;
              status: string;
            }) => (
              <Link
                key={jo.id}
                href={`/job-orders/${jo.jo_no}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset"
              >
                <div>
                  <p className="font-medium text-slate-900">{jo.jo_no}</p>
                  <p className="text-sm text-slate-500">
                    {jo.customer_name} — {jo.vehicle_plate}
                  </p>
                </div>
                <StatusBadge status={jo.status} />
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function MoneyCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
