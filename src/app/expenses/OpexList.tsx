'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, StatusBadge } from '@/components/ui';
import { formatPeso } from '@/lib/money';
import { hasPermission, ProjectRole } from '@/lib/roles';
import { approveOpexRequest } from '@/lib/api';
import { Loader2, Check } from 'lucide-react';
import type { OpexRequest } from '@/lib/types';

interface OpexListProps {
  requests: OpexRequest[];
  role: ProjectRole;
}

export default function OpexList({ requests, role }: OpexListProps) {
  const canApprove = hasPermission(role, 'opexApprove');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: string) {
    startTransition(async () => {
      await approveOpexRequest(id, role);
      router.refresh();
    });
  }

  return (
    <DataTable
      items={requests}
      caption="OPEX request list"
      emptyTitle="No OPEX requests yet"
      emptyDescription="Submit operational expenses for approval."
      columns={[
        {
          key: 'requestNo',
          header: 'Request No',
          widthClass: 'w-[18%]',
          className: 'tabular-nums',
          render: (o) => o.request_no,
        },
        {
          key: 'category',
          header: 'Category',
          widthClass: 'w-[16%]',
          render: (o) => o.category,
        },
        {
          key: 'description',
          header: 'Description',
          widthClass: 'w-[28%]',
          render: (o) => o.description,
        },
        {
          key: 'amount',
          header: 'Amount',
          widthClass: 'w-[16%]',
          numeric: true,
          render: (o) => formatPeso(o.amount_cents),
        },
        {
          key: 'status',
          header: 'Status',
          widthClass: 'w-[14%]',
          align: 'center',
          render: (o) => <StatusBadge status={o.status} />,
        },
        {
          key: 'actions',
          header: 'Actions',
          widthClass: 'w-[18%]',
          align: 'center',
          render: (o) =>
            o.status === 'PENDING_APPROVAL' && canApprove ? (
              <button
                type="button"
                onClick={() => handleApprove(o.id)}
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
