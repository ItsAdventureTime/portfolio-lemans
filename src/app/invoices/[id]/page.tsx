import { getDemoRole } from '@/lib/actor';
import { getInvoice } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { StatusBadge } from '@/components/ui';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EndToEndWorkflowVisualizer from '@/components/EndToEndWorkflowVisualizer';
import { ArrowLeft, Receipt, CreditCard, ShieldAlert } from 'lucide-react';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getDemoRole();
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
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Service Invoice #{invoice.invoice_no}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer:{' '}
              <span className="font-semibold text-slate-700">{invoice.customer_name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stage 5 Active Visualizer */}
      <EndToEndWorkflowVisualizer currentStage="BILLING" />

      {/* Invoice Card Template */}
      <div className="surface-card space-y-6 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-brand-primary" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Le Mans Service Plus OPC</h2>
              <p className="text-xs text-slate-500">Highway Pampang, Angeles City, Pampanga</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Service Invoice
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">{invoice.invoice_no}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Subtotal
            </p>
            <p className="font-mono font-semibold text-slate-900 mt-0.5">
              {formatPeso(invoice.subtotal_cents)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              VAT (12%)
            </p>
            <p className="font-mono font-semibold text-slate-900 mt-0.5">
              {formatPeso(invoice.vat_amount_cents)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Grand Total
            </p>
            <p className="font-mono font-extrabold text-brand-primary text-base mt-0.5">
              {formatPeso(invoice.total_cents)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Amount Paid
            </p>
            <p className="font-mono font-bold text-emerald-700 mt-0.5">
              {formatPeso(invoice.amount_paid_cents)}
            </p>
          </div>
        </div>

        {invoice.notes && (
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-xs text-slate-700">
            <span className="font-bold">Notes:</span> {invoice.notes}
          </div>
        )}
      </div>

      {/* Customer Payment Collections */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-slate-700" />
          <span>Recorded Customer Payments ({payments.length})</span>
        </h2>
        {payments.length === 0 ? (
          <div className="surface-card p-6 text-center text-sm text-slate-500">
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
                  className="px-5 py-3.5 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-900">{p.payment_method}</p>
                    <p className="text-xs text-slate-500">
                      Ref: <span className="font-mono">{p.reference_no || '—'}</span>
                    </p>
                  </div>
                  <span className="font-mono font-extrabold text-emerald-700 text-base">
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
        <p className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-slate-600 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>THIS IS NOT AN OFFICIAL RECEIPT. NOT VALID FOR CLAIMING INPUT TAX</span>
        </p>
      </div>
    </div>
  );
}
