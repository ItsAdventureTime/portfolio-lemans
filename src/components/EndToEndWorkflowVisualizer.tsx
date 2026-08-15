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
import { hasPermission, ProjectRole, ROLES } from '@/lib/roles';

export type WorkflowStageKey =
  'INTAKE' | 'QUOTATION' | 'JOB_ORDER' | 'PURCHASING' | 'BILLING' | 'COSTING' | 'ACCOUNTING';

export interface WorkflowStageInfo {
  key: WorkflowStageKey;
  stepNumber: number;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ElementType;
  permission: Parameters<typeof hasPermission>[1];
  primaryMetricLabel?: string;
  primaryMetricValue?: string | number;
  statusText?: string;
}

interface EndToEndWorkflowVisualizerProps {
  role: ProjectRole;
  currentStage?: WorkflowStageKey;
  counts?: {
    activeJobOrders?: number;
    partsPendingJobOrders?: number;
    completedJobOrders?: number;
    billedJobOrders?: number;
    pendingPurchaseRequests?: number;
  };
}

export default function EndToEndWorkflowVisualizer({
  role,
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
      permission: 'customerCreate',
      statusText: 'Fleet intake active',
    },
    {
      key: 'QUOTATION',
      stepNumber: 2,
      title: 'Quotation & Approval',
      subtitle: 'SQ estimation & conversion',
      href: '/quotations',
      icon: FileText,
      permission: 'salesQuotationCreate',
      statusText: 'Estimates & conversions',
    },
    {
      key: 'JOB_ORDER',
      stepNumber: 3,
      title: 'Job Order Execution',
      subtitle: 'Technicians, status & events',
      href: '/job-orders',
      icon: Wrench,
      permission: 'joChangeStatus',
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
      permission: 'prCreate',
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
      permission: 'invoiceRecordPayment',
      primaryMetricLabel: 'Billed JOs',
      primaryMetricValue: counts?.billedJobOrders ?? undefined,
      statusText: 'Billed & Collections',
    },
    {
      key: 'COSTING',
      stepNumber: 6,
      title: 'Job Costing',
      subtitle: 'Est. vs Actual labor/parts variance',
      href: '/job-costing',
      icon: Calculator,
      permission: 'viewJobCosting',
      statusText: 'Margin analysis',
    },
    {
      key: 'ACCOUNTING',
      stepNumber: 7,
      title: 'Accounting & Exports',
      subtitle: 'QBO CSV/JSON interchange',
      href: '/accounting',
      icon: Landmark,
      permission: 'viewAccounting',
      statusText: 'Admin summaries & exports',
    },
  ];

  const visibleStages = STAGES.filter((stage) => hasPermission(role, stage.permission));
  const currentStageIndex = currentStage
    ? visibleStages.findIndex((s) => s.key === currentStage)
    : -1;

  return (
    <section
      aria-label="End-to-End Operational Workflow"
      className="surface-card space-y-5 p-4 sm:p-6"
    >
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center">
        <div>
          <p className="utility-label mb-1 text-brand-primary">Connected workflow</p>
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950">
            <span>End-to-End Operational Lifecycle</span>
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Showing the stages available to {ROLES[role]}. One Job Order remains the single source
            of truth from intake to financial accounting.
          </p>
        </div>
        <div className="inline-flex min-h-9 items-center gap-2 self-start rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
          <span>{ROLES[role]} workflow view</span>
        </div>
      </div>

      <ol className="workflow-grid relative" aria-label="Available workflow stages">
        {visibleStages.map((stage, idx) => {
          const Icon = stage.icon;
          const isCurrent = currentStage ? stage.key === currentStage : false;
          const isCompleted = currentStageIndex >= 0 && idx < currentStageIndex;

          return (
            <li key={stage.key} className="relative flex flex-col h-full">
              <Link
                href={stage.href}
                className={`workflow-card group flex flex-col justify-between rounded-xl border p-4 transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  isCurrent
                    ? 'border-brand-primary bg-brand-light/55 ring-1 ring-brand-primary/30 shadow-[0_16px_30px_-24px_rgba(211,47,47,0.8)]'
                    : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300 hover:bg-emerald-50/55'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
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
                        className={`text-[11px] font-medium uppercase tracking-[0.08em] ${
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

                  <h3 className="break-words text-base font-bold leading-5 text-slate-950 transition-colors group-hover:text-brand-primary">
                    {stage.title}
                  </h3>
                  <p className="mt-1 break-words text-sm leading-5 text-slate-600">
                    {stage.subtitle}
                  </p>
                </div>

                <div className="mt-5 flex min-h-9 items-center justify-between gap-2 border-t border-slate-200/80 pt-3 text-xs">
                  {stage.primaryMetricValue !== undefined ? (
                    <span className="font-medium text-slate-900">
                      {stage.primaryMetricLabel}:{' '}
                      <span className="text-brand-primary">{stage.primaryMetricValue}</span>
                    </span>
                  ) : (
                    <span className="break-words text-slate-600">{stage.statusText}</span>
                  )}
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
