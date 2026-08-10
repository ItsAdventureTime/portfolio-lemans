'use client';

import Link from 'next/link';
import { DataTable } from '@/components/ui';

interface Customer {
  id: string;
  customer_no: string;
  name: string;
  phone: string;
  email: string;
}

interface CustomerListProps {
  customers: Customer[];
}

export default function CustomerList({ customers }: CustomerListProps) {
  return (
    <DataTable
      items={customers}
      caption="Customer and vehicle list"
      emptyTitle="No customers yet"
      emptyDescription="Add a customer and their vehicle using the form above."
      columns={[
        {
          key: 'customerNo',
          header: 'Customer No',
          render: (c) => (
            <Link href={`/customers/${c.id}`} className="text-brand-primary hover:underline">
              {c.customer_no}
            </Link>
          ),
        },
        { key: 'name', header: 'Name', render: (c) => c.name },
        { key: 'phone', header: 'Phone', render: (c) => c.phone || '—' },
        { key: 'email', header: 'Email', render: (c) => c.email || '—' },
      ]}
    />
  );
}
