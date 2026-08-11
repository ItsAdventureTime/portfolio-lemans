'use client';

import Link from 'next/link';
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
          render: (q) => (
            <Link
              href={`/quotations/${q.id}`}
              className="inline-flex items-center min-h-11 text-brand-primary hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded px-1 -mx-1"
            >
              {q.quote_no}
            </Link>
          ),
        },
        { key: 'customer', header: 'Customer', render: (q) => q.customer_name },
        { key: 'vehicle', header: 'Vehicle', render: (q) => q.vehicle_plate },
        { key: 'netTotal', header: 'Net Total', render: (q) => formatPeso(q.net_total_cents) },
        {
          key: 'status',
          header: 'Status',
          render: (q) => <StatusBadge status={q.status} />,
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (q) => (
            <div className="flex items-center gap-2">
              {q.status === 'DRAFT' && canApprove && (
                <>
                  <button
                    onClick={() => run(() => approveQuotation(q.id, role))}
                    disabled={isPending}
                    className="inline-flex items-center h-11 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => run(() => rejectQuotation(q.id, role))}
                    disabled={isPending}
                    className="inline-flex items-center h-11 px-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    Reject
                  </button>
                </>
              )}
              {q.status === 'APPROVED' && canConvert && (
                <button
                  onClick={() => run(() => convertQuotation(q.id, role))}
                  disabled={isPending}
                  className="inline-flex items-center h-11 px-3 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
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
