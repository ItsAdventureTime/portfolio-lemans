import { getDemoRole } from '@/lib/actor';
import { getAccountingSummary } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { hasPermission } from '@/lib/roles';
import { DataTable, StatusBadge } from '@/components/ui';
import AccessDenied from '@/components/AccessDenied';
import { getApiUrl } from '@/lib/api-url';
import PageHeader from '@/components/PageHeader';
import EndToEndWorkflowVisualizer from '@/components/EndToEndWorkflowVisualizer';
import type { Customer, Invoice } from '@/lib/types';
import { Download, FileSpreadsheet, FileCode } from 'lucide-react';

export default async function AccountingPage() {
  const role = await getDemoRole();
  if (!hasPermission(role, 'viewAccounting')) {
    return <AccessDenied role={role} requiredCapability="viewAccounting" />;
  }
  const data = await getAccountingSummary(role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounting & Export Interchange"
        description="Admin-only operational GL/AP ledgers and QuickBooks-ready export files."
      />

      <EndToEndWorkflowVisualizer currentStage="ACCOUNTING" />

      <section className="surface-card space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-brand-primary" />
              <span>Accounting exports</span>
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Download deterministic customer, vendor, billing, expense, collection, and payment
              interchange files.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href={getApiUrl('/api/accounting/export/csv')}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-primary px-4 text-xs font-semibold text-white hover:bg-brand-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel-compatible CSV</span>
            </a>
            <a
              href={getApiUrl('/api/accounting/export/json')}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <FileCode className="w-4 h-4" />
              <span>Download JSON</span>
            </a>
          </div>
        </div>
      </section>

      <section className="surface-card space-y-3 p-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          Customer Ledger ({data.customers.length})
        </h2>
        <DataTable<Customer>
          items={data.customers}
          caption="Customer summary"
          emptyTitle="No customers"
          emptyDescription="No customer records found."
          columns={[
            {
              key: 'customerNo',
              header: 'Customer No',
              render: (c) => <span className="font-bold text-slate-900">{c.customer_no}</span>,
            },
            {
              key: 'name',
              header: 'Customer Name',
              render: (c) => <span className="font-medium">{c.name}</span>,
            },
            {
              key: 'tin',
              header: 'TIN',
              render: (c) => <span className="font-mono">{c.tin || '—'}</span>,
            },
          ]}
        />
      </section>

      <section className="surface-card space-y-3 p-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          Service Invoice Ledger ({data.invoices.length})
        </h2>
        <DataTable<Invoice>
          items={data.invoices}
          caption="Invoice summary"
          emptyTitle="No invoices"
          emptyDescription="No invoice records found."
          columns={[
            {
              key: 'invoiceNo',
              header: 'Invoice No',
              render: (inv) => (
                <span className="font-mono font-bold text-slate-900">{inv.invoice_no}</span>
              ),
            },
            {
              key: 'customer',
              header: 'Customer',
              render: (inv) => <span className="font-medium">{inv.customer_name}</span>,
            },
            {
              key: 'total',
              header: 'Total Amount',
              render: (inv) => (
                <span className="font-mono font-bold text-slate-900">
                  {formatPeso(inv.total_cents)}
                </span>
              ),
            },
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
