'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, StatusBadge } from '@/components/ui';
import { formatPeso } from '@/lib/money';
import { hasPermission, ProjectRole } from '@/lib/roles';
import { approveOpexRequest } from '@/lib/api';
import { Loader2, Check } from 'lucide-react';

interface OpexRequest {
  id: string;
  request_no: string;
  category: string;
  description: string;
  amount_cents: number;
  status: string;
}

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
        { key: 'requestNo', header: 'Request No', render: (o) => o.request_no },
        { key: 'category', header: 'Category', render: (o) => o.category },
        { key: 'description', header: 'Description', render: (o) => o.description },
        { key: 'amount', header: 'Amount', render: (o) => formatPeso(o.amount_cents) },
        {
          key: 'status',
          header: 'Status',
          render: (o) => <StatusBadge status={o.status} />,
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (o) =>
            o.status === 'PENDING_APPROVAL' && canApprove ? (
              <button
                onClick={() => handleApprove(o.id)}
                disabled={isPending}
                className="inline-flex items-center h-8 px-3 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
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
