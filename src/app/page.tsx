import Link from 'next/link';
import { getDemoRole } from '@/lib/actor';
import { isDemoEntered } from '@/lib/demo-entry.server';
import { getDashboard } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { StatusBadge } from '@/components/ui';
import DemoSplash from '@/components/DemoSplash';
import EndToEndWorkflowVisualizer from '@/components/EndToEndWorkflowVisualizer';
import { ArrowUpRight, Plus, Wrench, Users } from 'lucide-react';

export default async function DashboardOverview() {
  const entered = await isDemoEntered();
  if (!entered) {
    return <DemoSplash />;
  }

  const role = await getDemoRole();
  const data = await getDashboard(role);

  return (
    <div className="space-y-8">
      {/* Page Heading & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Operations Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status tracking and end-to-end workflow management for Le Mans Service Plus.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2.5 rounded-lg min-h-11 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <Users className="w-4 h-4" />
            <span>New Customer / Vehicle</span>
          </Link>
          <Link
            href="/quotations"
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold px-3.5 py-2.5 rounded-lg min-h-11 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <Plus className="w-4 h-4" />
            <span>New Sales Quote</span>
          </Link>
        </div>
      </div>

      {/* Connected 7-stage Visualizer */}
      <EndToEndWorkflowVisualizer counts={data.counts} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Job Orders"
          value={data.counts.activeJobOrders}
          hint="Work in progress"
        />
        <StatCard
          label="Parts Pending"
          value={data.counts.partsPendingJobOrders}
          hint="Awaiting inventory / PR"
        />
        <StatCard
          label="Completed JOs"
          value={data.counts.completedJobOrders}
          hint="Ready for billing"
        />
        <StatCard
          label="Pending PRs"
          value={data.counts.pendingPurchaseRequests}
          hint="Awaiting GM approval"
        />
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MoneyCard label="Total Billed Revenue" value={formatPeso(data.financials.billedCents)} />
        <MoneyCard label="Total Actual Cost" value={formatPeso(data.financials.actualCostCents)} />
        <MoneyCard
          label="Net Profit"
          value={formatPeso(data.financials.netProfitCents)}
          highlight={data.financials.netProfitCents > 0}
        />
      </div>

      {/* Recent Job Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Recent Job Orders</h2>
            <p className="text-xs text-slate-500">
              Live operational status and assigned technicians
            </p>
          </div>
          <Link
            href="/job-orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded px-2 py-1"
          >
            <span>View All JOs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-200">
          {data.recentJobOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No recent job orders found.
            </div>
          ) : (
            data.recentJobOrders.map(
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
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset min-h-11"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm tracking-tight">{jo.jo_no}</p>
                      <p className="text-xs text-slate-500">
                        {jo.customer_name} — <span className="font-mono">{jo.vehicle_plate}</span>
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={jo.status} />
                </Link>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums mt-1">
          {value}
        </p>
      </div>
      {hint && <p className="text-[11px] text-slate-400 mt-2">{hint}</p>}
    </div>
  );
}

function MoneyCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 sm:p-5 shadow-sm ${highlight ? 'border-emerald-300 bg-emerald-50/10' : 'border-slate-200'}`}
    >
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p
        className={`text-xl sm:text-2xl font-extrabold tabular-nums mt-1 ${highlight ? 'text-emerald-700' : 'text-slate-900'}`}
      >
        {value}
      </p>
    </div>
  );
}
