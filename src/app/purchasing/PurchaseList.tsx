'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, StatusBadge } from '@/components/ui';
import { hasPermission, ProjectRole } from '@/lib/roles';
import { approvePurchaseRequest } from '@/lib/api';
import { Loader2, Check } from 'lucide-react';
import type { PurchaseRequest } from '@/lib/types';

interface PurchaseListProps {
  purchaseRequests: PurchaseRequest[];
  role: ProjectRole;
}

export default function PurchaseList({ purchaseRequests, role }: PurchaseListProps) {
  const canApprove = hasPermission(role, 'prApprove');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: string) {
    startTransition(async () => {
      await approvePurchaseRequest(id, role);
      router.refresh();
    });
  }

  return (
    <DataTable
      items={purchaseRequests}
      caption="Purchase request list"
      emptyTitle="No purchase requests yet"
      emptyDescription="Create purchase requests for parts and supplies."
      columns={[
        { key: 'prNo', header: 'PR No', render: (pr) => pr.pr_no },
        { key: 'supplier', header: 'Supplier', render: (pr) => pr.supplier || '—' },
        {
          key: 'status',
          header: 'Status',
          render: (pr) => <StatusBadge status={pr.status} />,
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (pr) =>
            pr.status === 'PENDING_APPROVAL' && canApprove ? (
              <button
                type="button"
                onClick={() => handleApprove(pr.id)}
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
