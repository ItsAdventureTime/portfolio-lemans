import Link from 'next/link';
import { getDemoRole } from '@/lib/actor';
import { isDemoEntered } from '@/lib/demo-entry.server';
import { getDashboard } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { hasPermission, ROLES } from '@/lib/roles';
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
    <div className="space-y-8 sm:space-y-10">
      <section
        className="surface-card relative overflow-hidden border-l-4 border-l-brand-primary p-5 sm:p-7"
        aria-labelledby="overview-heading"
      >
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="utility-label mb-2 text-brand-primary">
              Today&apos;s operating picture · {ROLES[role]} view
            </p>
            <h1
              id="overview-heading"
              className="text-balance text-3xl font-extrabold tracking-[-0.04em] text-slate-950 sm:text-4xl"
            >
              Operations Overview
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              See the work moving through LeMans Service Plus and take the next action from one calm
              operating view.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {hasPermission(role, 'customerCreate') && (
              <Link href="/customers" className="action-secondary">
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>New customer / vehicle</span>
              </Link>
            )}
            {hasPermission(role, 'salesQuotationCreate') && (
              <Link href="/quotations" className="action-primary">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>New sales quote</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="workflow-heading">
        <div className="sr-only">
          <h2 id="workflow-heading">End-to-end workflow</h2>
        </div>
        <EndToEndWorkflowVisualizer counts={data.counts} />
      </section>

      <section aria-labelledby="operational-counts-heading">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="utility-label">Operational counts</p>
            <h2 id="operational-counts-heading" className="mt-1 text-lg font-bold text-slate-950">
              Work requiring attention
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Seeded demo data, updated with the active role
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
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
      </section>

      <section aria-labelledby="financial-summary-heading">
        <div className="mb-3">
          <p className="utility-label">Financial snapshot</p>
          <h2 id="financial-summary-heading" className="mt-1 text-lg font-bold text-slate-950">
            Revenue and cost position
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <MoneyCard label="Total Billed Revenue" value={formatPeso(data.financials.billedCents)} />
          <MoneyCard
            label="Total Actual Cost"
            value={formatPeso(data.financials.actualCostCents)}
          />
          <MoneyCard
            label="Net Profit"
            value={formatPeso(data.financials.netProfitCents)}
            highlight={data.financials.netProfitCents > 0}
          />
        </div>
      </section>

      <section className="surface-card overflow-hidden" aria-labelledby="recent-orders-heading">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div>
            <h2 id="recent-orders-heading" className="text-base font-bold text-slate-950">
              Recent job orders
            </h2>
            <p className="text-xs text-slate-500">Current status and assigned technicians</p>
          </div>
          <Link
            href="/job-orders"
            className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-brand-primary transition-colors hover:bg-brand-light hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <span>View all</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="divide-y divide-slate-200/80">
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
                  className="flex min-h-16 items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-primary ring-1 ring-brand-primary/10">
                      <Wrench className="h-4 w-4" aria-hidden="true" />
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
      </section>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <article className="surface-card flex min-h-32 flex-col justify-between border-t-2 border-t-brand-primary/70 p-4 sm:p-5">
      <div>
        <p className="utility-label">{label}</p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 tabular-nums sm:text-3xl">
          {value}
        </p>
      </div>
      {hint && <p className="mt-2 text-[11px] text-slate-500">{hint}</p>}
    </article>
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
    <article
      className={`surface-card border-t-2 p-4 sm:p-5 ${highlight ? 'border-t-emerald-500 bg-emerald-50/30' : 'border-t-slate-300'}`}
    >
      <p className="utility-label">{label}</p>
      <p
        className={`mt-2 text-xl font-extrabold tracking-tight tabular-nums sm:text-2xl ${highlight ? 'text-emerald-700' : 'text-slate-950'}`}
      >
        {value}
      </p>
    </article>
  );
}
