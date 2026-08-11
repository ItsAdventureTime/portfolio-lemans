'use client';

import Link from 'next/link';
import { DataTable } from '@/components/ui';
import type { Customer } from '@/lib/types';

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
            <Link
              href={`/customers/${c.id}`}
              className="inline-flex items-center min-h-11 text-brand-primary hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded px-1 -mx-1"
            >
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
