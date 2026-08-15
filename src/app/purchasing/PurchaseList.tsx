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
        {
          key: 'prNo',
          header: 'PR No',
          widthClass: 'w-[20%]',
          className: 'tabular-nums',
          render: (pr) => pr.pr_no,
        },
        {
          key: 'supplier',
          header: 'Supplier',
          widthClass: 'w-[38%]',
          render: (pr) => pr.supplier || '—',
        },
        {
          key: 'status',
          header: 'Status',
          widthClass: 'w-[18%]',
          align: 'center',
          render: (pr) => <StatusBadge status={pr.status} />,
        },
        {
          key: 'actions',
          header: 'Actions',
          widthClass: 'w-[24%]',
          align: 'center',
          render: (pr) =>
            pr.status === 'PENDING_APPROVAL' && canApprove ? (
              <button
                type="button"
                onClick={() => handleApprove(pr.id)}
                disabled={isPending}
                className="action-compact action-compact-primary"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 motion-safe:animate-spin" />
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
