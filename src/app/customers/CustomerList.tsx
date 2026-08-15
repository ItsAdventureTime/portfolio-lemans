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
          widthClass: 'w-[20%]',
          className: 'tabular-nums',
          render: (c) => (
            <Link
              href={`/customers/${c.id}`}
              className="inline-flex min-h-11 items-center rounded px-1 -mx-1 font-medium text-brand-primary hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              {c.customer_no}
            </Link>
          ),
        },
        { key: 'name', header: 'Name', widthClass: 'w-[28%]', render: (c) => c.name },
        {
          key: 'phone',
          header: 'Phone',
          widthClass: 'w-[20%]',
          className: 'tabular-nums',
          render: (c) => c.phone || '—',
        },
        { key: 'email', header: 'Email', widthClass: 'w-[32%]', render: (c) => c.email || '—' },
      ]}
    />
  );
}
