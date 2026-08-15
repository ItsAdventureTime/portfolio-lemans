import { getDemoRole } from '@/lib/actor';
import { getInvoice } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { canAccessModule } from '@/lib/roles';
import { StatusBadge } from '@/components/ui';
import AccessDenied from '@/components/AccessDenied';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Receipt, CreditCard, ShieldAlert } from 'lucide-react';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getDemoRole();
  if (!canAccessModule(role, 'invoices')) {
    return <AccessDenied role={role} requiredCapability="invoiceCreate or invoiceRecordPayment" />;
  }
  const { invoice, payments } = await getInvoice(id, role);
  if (!invoice) return notFound();

  return (
    <div className="space-y-6">
      {/* Header & Back Link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Back to Invoices list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Service Invoice #{invoice.invoice_no}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Customer: <span className="text-slate-700">{invoice.customer_name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Card Template */}
      <div className="surface-card space-y-6 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-brand-primary" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Le Mans Service Plus OPC</h2>
              <p className="text-sm text-slate-500">Highway Pampang, Angeles City, Pampanga</p>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-sm text-slate-500">Service Invoice</span>
            <span className="font-mono text-base font-semibold text-slate-900">
              {invoice.invoice_no}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 text-base sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="text-sm text-slate-500">Subtotal</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
              {formatPeso(invoice.subtotal_cents)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">VAT (12%)</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
              {formatPeso(invoice.vat_amount_cents)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Grand Total</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-brand-primary">
              {formatPeso(invoice.total_cents)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Amount Paid</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-emerald-700">
              {formatPeso(invoice.amount_paid_cents)}
            </p>
          </div>
        </div>

        {invoice.notes && (
          <div className="surface-card-inset p-4 text-sm leading-6 text-slate-700">
            <span>Notes:</span> {invoice.notes}
          </div>
        )}
      </div>

      {/* Customer Payment Collections */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <CreditCard className="w-5 h-5 text-slate-700" />
          <span>Recorded Customer Payments ({payments.length})</span>
        </h2>
        {payments.length === 0 ? (
          <div className="surface-card p-6 text-center text-base text-slate-500">
            No payments recorded yet for this invoice.
          </div>
        ) : (
          <div className="surface-card divide-y divide-slate-100 overflow-hidden">
            {payments.map(
              (p: {
                id: string;
                payment_method: string;
                reference_no?: string;
                amount_cents: number;
              }) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-5 py-4 text-base transition-colors hover:bg-slate-50"
                >
                  <div>
                    <p className="text-slate-900">{p.payment_method}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Ref: <span className="font-mono">{p.reference_no || '—'}</span>
                    </p>
                  </div>
                  <span className="font-mono text-lg font-semibold tabular-nums text-emerald-700">
                    {formatPeso(p.amount_cents)}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Mandatory Official Receipt Notice (AC-BILL-001) */}
      <div className="border-t border-slate-300 pt-5 text-center">
        <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-600">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>THIS IS NOT AN OFFICIAL RECEIPT. NOT VALID FOR CLAIMING INPUT TAX</span>
        </p>
      </div>
    </div>
  );
}
