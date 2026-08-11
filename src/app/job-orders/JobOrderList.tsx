'use client';

import Link from 'next/link';
import { DataTable, StatusBadge } from '@/components/ui';
import type { JobOrder } from '@/lib/types';

interface JobOrderListProps {
  jobOrders: JobOrder[];
}

export default function JobOrderList({ jobOrders }: JobOrderListProps) {
  return (
    <DataTable
      items={jobOrders}
      caption="Job order list"
      emptyTitle="No job orders yet"
      emptyDescription="Approve and convert a quotation to create the first job order."
      columns={[
        {
          key: 'joNo',
          header: 'JO No',
          render: (jo) => (
            <Link
              href={`/job-orders/${jo.jo_no}`}
              className="inline-flex items-center min-h-11 text-brand-primary hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded px-1 -mx-1"
            >
              {jo.jo_no}
            </Link>
          ),
        },
        { key: 'customer', header: 'Customer', render: (jo) => jo.customer_name },
        { key: 'vehicle', header: 'Vehicle', render: (jo) => jo.vehicle_plate },
        {
          key: 'status',
          header: 'Status',
          render: (jo) => <StatusBadge status={jo.status} />,
        },
        { key: 'technician', header: 'Technician', render: (jo) => jo.technician || '—' },
      ]}
    />
  );
}
