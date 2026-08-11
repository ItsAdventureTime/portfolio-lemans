import { getDemoRole } from '@/lib/actor';
import { getAccountingSummary } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { hasPermission } from '@/lib/roles';
import { DataTable, StatusBadge } from '@/components/ui';
import AccessDenied from '@/components/AccessDenied';
import { getApiUrl } from '@/lib/api-url';
import type { Customer, Invoice } from '@/lib/types';

export default async function AccountingPage() {
  const role = await getDemoRole();
  if (!hasPermission(role, 'viewAccounting')) {
    return <AccessDenied role={role} requiredCapability="viewAccounting" />;
  }
  const data = await getAccountingSummary(role);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Accounting Summary</h1>

      <section className="bg-white rounded border border-slate-200 p-4 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="text-lg font-semibold">Accounting exports</h2>
          <p className="text-sm text-slate-600">
            Download deterministic customer, vendor, billing, expense, collection, and payment
            records.
          </p>
        </div>
        <a
          href={getApiUrl('/api/accounting/export/csv')}
          className="inline-flex min-h-11 items-center rounded-md bg-brand-primary px-4 font-medium text-white hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          Download Excel-compatible CSV
        </a>
        <a
          href={getApiUrl('/api/accounting/export/json')}
          className="inline-flex min-h-11 items-center rounded-md border border-slate-300 px-4 font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          Download JSON
        </a>
      </section>

      <section className="bg-white rounded border border-slate-200 p-4">
        <h2 className="text-lg font-semibold mb-3">Customers</h2>
        <DataTable<Customer>
          items={data.customers}
          caption="Customer summary"
          emptyTitle="No customers"
          emptyDescription="No customer records found."
          columns={[
            { key: 'customerNo', header: 'No', render: (c) => c.customer_no },
            { key: 'name', header: 'Name', render: (c) => c.name },
            { key: 'tin', header: 'TIN', render: (c) => c.tin || '—' },
          ]}
        />
      </section>

      <section className="bg-white rounded border border-slate-200 p-4">
        <h2 className="text-lg font-semibold mb-3">Invoices</h2>
        <DataTable<Invoice>
          items={data.invoices}
          caption="Invoice summary"
          emptyTitle="No invoices"
          emptyDescription="No invoice records found."
          columns={[
            { key: 'invoiceNo', header: 'Invoice No', render: (inv) => inv.invoice_no },
            { key: 'customer', header: 'Customer', render: (inv) => inv.customer_name },
            { key: 'total', header: 'Total', render: (inv) => formatPeso(inv.total_cents) },
            {
              key: 'status',
              header: 'Status',
              render: (inv) => <StatusBadge status={inv.status} />,
            },
          ]}
        />
      </section>
    </div>
  );
}
