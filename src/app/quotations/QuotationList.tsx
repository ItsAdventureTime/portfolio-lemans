'use client';

import { DataTable, StatusBadge } from '@/components/ui';
import { formatPeso } from '@/lib/money';
import { hasPermission, ProjectRole } from '@/lib/roles';
import { approveQuotation, convertQuotation, rejectQuotation } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Loader2, Check, X, FilePlus } from 'lucide-react';
import type { Quote } from '@/lib/types';

interface QuotationListProps {
  quotes: Quote[];
  role: ProjectRole;
}

export default function QuotationList({ quotes, role }: QuotationListProps) {
  const canApprove = hasPermission(role, 'quoteApprove');
  const canConvert = hasPermission(role, 'quoteConvert');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <DataTable
      items={quotes}
      caption="Quotation list"
      emptyTitle="No quotations yet"
      emptyDescription="Create a quotation above."
      columns={[
        {
          key: 'quoteNo',
          header: 'Quote No',
          widthClass: 'w-[16%]',
          className: 'tabular-nums',
          render: (q) => (
            <span
              id={`quotation-${q.id}`}
              className="inline-flex min-h-11 max-w-full items-center break-all font-mono text-slate-900 sm:break-normal"
            >
              {q.quote_no}
            </span>
          ),
        },

        {
          key: 'customer',
          header: 'Customer',
          widthClass: 'w-[20%]',
          className: 'hidden sm:table-cell',
          render: (q) => q.customer_name,
        },
        {
          key: 'vehicle',
          header: 'Vehicle',
          widthClass: 'w-[14%]',
          className: 'hidden lg:table-cell tabular-nums',
          render: (q) => q.vehicle_plate,
        },
        {
          key: 'netTotal',
          header: 'Net Total',
          widthClass: 'w-[15%]',
          className: 'hidden sm:table-cell',
          numeric: true,
          render: (q) => formatPeso(q.net_total_cents),
        },
        {
          key: 'status',
          header: 'Status',
          widthClass: 'w-[14%]',
          align: 'center',
          render: (q) => <StatusBadge status={q.status} />,
        },
        {
          key: 'actions',
          header: 'Actions',
          widthClass: 'w-[21%]',
          render: (q) => (
            <div className="flex flex-wrap items-center gap-1.5">
              {q.status === 'DRAFT' && canApprove && (
                <>
                  <button
                    type="button"
                    onClick={() => run(() => approveQuotation(q.id, role))}
                    disabled={isPending}
                    className="action-compact action-compact-success"
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 motion-safe:animate-spin" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => rejectQuotation(q.id, role))}
                    disabled={isPending}
                    className="action-compact action-compact-danger"
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 motion-safe:animate-spin" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    Reject
                  </button>
                </>
              )}
              {q.status === 'APPROVED' && canConvert && (
                <button
                  type="button"
                  onClick={() => run(() => convertQuotation(q.id, role))}
                  disabled={isPending}
                  className="action-compact action-compact-primary"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 motion-safe:animate-spin" />
                  ) : (
                    <FilePlus className="h-3 w-3 mr-1" />
                  )}
                  Convert to JO
                </button>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}
