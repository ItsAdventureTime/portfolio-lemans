'use client';

import Link from 'next/link';
import { DataTable, StatusBadge } from '@/components/ui';

interface JobOrder {
  id: string;
  jo_no: string;
  customer_name: string;
  vehicle_plate: string;
  status: string;
  technician?: string;
}

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
            <Link href={`/job-orders/${jo.jo_no}`} className="text-brand-primary hover:underline">
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
