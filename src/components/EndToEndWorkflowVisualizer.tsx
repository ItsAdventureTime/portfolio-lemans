'use client';

import Link from 'next/link';
import {
  Users,
  FileText,
  Wrench,
  ShoppingCart,
  Receipt,
  Calculator,
  Landmark,
  ArrowRight,
} from 'lucide-react';

export type WorkflowStageKey =
  'INTAKE' | 'QUOTATION' | 'JOB_ORDER' | 'PURCHASING' | 'BILLING' | 'COSTING' | 'ACCOUNTING';

export interface WorkflowStageInfo {
  key: WorkflowStageKey;
  stepNumber: number;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ElementType;
  primaryMetricLabel?: string;
  primaryMetricValue?: string | number;
  statusText?: string;
}

interface EndToEndWorkflowVisualizerProps {
  currentStage?: WorkflowStageKey;
  counts?: {
    activeJobOrders?: number;
    partsPendingJobOrders?: number;
    completedJobOrders?: number;
    pendingPurchaseRequests?: number;
  };
}

export default function EndToEndWorkflowVisualizer({
  currentStage,
  counts,
}: EndToEndWorkflowVisualizerProps) {
  const STAGES: WorkflowStageInfo[] = [
    {
      key: 'INTAKE',
      stepNumber: 1,
      title: 'Customer & Vehicle',
      subtitle: 'Check-in & profile creation',
      href: '/customers',
      icon: Users,
      statusText: 'Fleet intake active',
    },
    {
      key: 'QUOTATION',
      stepNumber: 2,
      title: 'Quotation & Approval',
      subtitle: 'SQ estimation & conversion',
      href: '/quotations',
      icon: FileText,
      statusText: 'Estimates & conversions',
    },
    {
      key: 'JOB_ORDER',
      stepNumber: 3,
      title: 'Job Order Execution',
      subtitle: 'Technicians, status & events',
      href: '/job-orders',
      icon: Wrench,
      primaryMetricLabel: 'Active JOs',
      primaryMetricValue: counts?.activeJobOrders ?? undefined,
      statusText: counts?.partsPendingJobOrders
        ? `${counts.partsPendingJobOrders} Parts Pending`
        : 'Active work tracking',
    },
    {
      key: 'PURCHASING',
      stepNumber: 4,
      title: 'Purchasing & Allocation',
      subtitle: 'PRs, POs & supplier invoices',
      href: '/purchasing',
      icon: ShoppingCart,
      primaryMetricLabel: 'Pending PRs',
      primaryMetricValue: counts?.pendingPurchaseRequests ?? undefined,
      statusText: 'Cost allocation active',
    },
    {
      key: 'BILLING',
      stepNumber: 5,
      title: 'Invoice & Collection',
      subtitle: 'Service invoices & AR payment',
      href: '/invoices',
      icon: Receipt,
      primaryMetricLabel: 'Completed JOs',
      primaryMetricValue: counts?.completedJobOrders ?? undefined,
      statusText: 'Billed & Collections',
    },
    {
      key: 'COSTING',
      stepNumber: 6,
      title: 'Job Costing',
      subtitle: 'Est. vs Actual labor/parts variance',
      href: '/job-costing',
      icon: Calculator,
      statusText: 'Margin analysis',
    },
    {
      key: 'ACCOUNTING',
      stepNumber: 7,
      title: 'Accounting & Exports',
      subtitle: 'QBO CSV/JSON interchange',
      href: '/accounting',
      icon: Landmark,
      statusText: 'Admin summaries & exports',
    },
  ];

  const currentStageIndex = currentStage ? STAGES.findIndex((s) => s.key === currentStage) : -1;

  return (
    <section
      aria-label="End-to-End Operational Workflow"
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>End-to-End Operational Lifecycle</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            One Job Order is the single source of truth from intake to financial accounting.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>Live Workflow Connectivity</span>
        </div>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 relative">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isCurrent = currentStage ? stage.key === currentStage : false;
          const isCompleted = currentStageIndex >= 0 && idx < currentStageIndex;

          return (
            <li key={stage.key} className="relative flex flex-col h-full">
              <Link
                href={stage.href}
                className={`group flex-1 flex flex-col justify-between p-3.5 rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary min-h-[140px] ${
                  isCurrent
                    ? 'border-brand-primary bg-red-50/30 ring-1 ring-brand-primary/30 shadow-sm'
                    : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                          isCurrent
                            ? 'bg-brand-primary text-white'
                            : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {stage.stepNumber}
                      </span>
                      <span
                        className={`text-[11px] font-semibold tracking-wide uppercase ${
                          isCurrent
                            ? 'text-brand-primary'
                            : isCompleted
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                        }`}
                      >
                        {isCompleted ? '✓ Completed' : isCurrent ? 'Active Stage' : 'Stage'}
                      </span>
                    </div>
                    <Icon
                      className={`w-4 h-4 ${
                        isCurrent
                          ? 'text-brand-primary'
                          : isCompleted
                            ? 'text-emerald-600'
                            : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-1">
                    {stage.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{stage.subtitle}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between gap-1 text-[11px]">
                  {stage.primaryMetricValue !== undefined ? (
                    <span className="font-bold text-slate-900">
                      {stage.primaryMetricLabel}:{' '}
                      <span className="text-brand-primary">{stage.primaryMetricValue}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 truncate">{stage.statusText}</span>
                  )}
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
