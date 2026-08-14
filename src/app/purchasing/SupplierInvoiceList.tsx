'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, StatusBadge } from '@/components/ui';
import { formatPeso } from '@/lib/money';
import { hasPermission, ProjectRole } from '@/lib/roles';
import { approveSupplierInvoice } from '@/lib/api';
import { Loader2, Check } from 'lucide-react';
import type { SupplierInvoice } from '@/lib/types';

interface SupplierInvoiceListProps {
  supplierInvoices: SupplierInvoice[];
  role: ProjectRole;
}

export default function SupplierInvoiceList({ supplierInvoices, role }: SupplierInvoiceListProps) {
  const canApprove = hasPermission(role, 'supplierInvoiceApprove');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: string) {
    startTransition(async () => {
      await approveSupplierInvoice(id, role);
      router.refresh();
    });
  }

  return (
    <DataTable
      items={supplierInvoices}
      caption="Supplier invoice list"
      emptyTitle="No supplier invoices yet"
      emptyDescription="Create supplier invoices and allocate costs to job orders."
      columns={[
        { key: 'siNo', header: 'SI No', render: (si) => si.si_no },
        { key: 'supplier', header: 'Supplier', render: (si) => si.supplier || '—' },
        { key: 'total', header: 'Total', render: (si) => formatPeso(si.total_amount_cents) },
        {
          key: 'status',
          header: 'Status',
          render: (si) => <StatusBadge status={si.status} />,
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (si) =>
            si.status === 'ALLOCATED' && canApprove ? (
              <button
                type="button"
                onClick={() => handleApprove(si.id)}
                disabled={isPending}
                className="inline-flex items-center h-11 px-3 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Approve
              </button>
            ) : (
              '—'
            ),
        },
      ]}
    />
  );
}
