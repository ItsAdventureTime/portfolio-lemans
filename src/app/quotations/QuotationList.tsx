'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/ui';
import { formatPeso } from '@/lib/money';
import { hasPermission, ProjectRole } from '@/lib/roles';
import { approveQuotation, convertQuotation, rejectQuotation } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Loader2, Check, X, FilePlus } from 'lucide-react';

interface Quote {
  id: string;
  quote_no: string;
  customer_name: string;
  vehicle_plate: string;
  net_total_cents: number;
  status: string;
}

interface QuotationListProps {
  quotes: Quote[];
  role: ProjectRole;
}

export default function QuotationList({ quotes, role }: QuotationListProps) {
  const canApprove = hasPermission(role, 'quoteApprove');
  const canConvert = hasPermission(role, 'quoteConvert');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No quotations yet. Create one above.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Quote No</th>
              <th className="text-left px-4 py-3 font-semibold">Customer</th>
              <th className="text-left px-4 py-3 font-semibold">Vehicle</th>
              <th className="text-left px-4 py-3 font-semibold">Net Total</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {quotes.map((q) => (
              <tr key={q.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 whitespace-nowrap">{q.quote_no}</td>
                <td className="px-4 py-3 whitespace-nowrap">{q.customer_name}</td>
                <td className="px-4 py-3 whitespace-nowrap">{q.vehicle_plate}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatPeso(q.net_total_cents)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={q.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {q.status === 'DRAFT' && canApprove && (
                      <>
                        <button
                          onClick={() => run(() => approveQuotation(q.id, role))}
                          disabled={isPending}
                          className="inline-flex items-center h-8 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
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
                          className="inline-flex items-center h-8 px-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors disabled:opacity-50"
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
                        className="inline-flex items-center h-8 px-3 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
