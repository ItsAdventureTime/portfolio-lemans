import { getDemoRole } from '@/lib/actor';
import { getInvoice } from '@/lib/api';
import { formatPeso } from '@/lib/api';
import { notFound } from 'next/navigation';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getDemoRole();
  const { invoice, payments } = await getInvoice(id, role);
  if (!invoice) return notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Invoice {invoice.invoice_no}</h1>

      <div className="bg-white p-4 rounded border border-slate-200 text-sm space-y-2">
        <p>
          <strong>Customer:</strong> {invoice.customer_name}
        </p>
        <p>
          <strong>Subtotal:</strong> {formatPeso(invoice.subtotal_cents)}
        </p>
        <p>
          <strong>VAT (12%):</strong> {formatPeso(invoice.vat_amount_cents)}
        </p>
        <p>
          <strong>Total:</strong> {formatPeso(invoice.total_cents)}
        </p>
        <p>
          <strong>Paid:</strong> {formatPeso(invoice.amount_paid_cents)}
        </p>
        <p>
          <strong>Status:</strong> {invoice.status}
        </p>
      </div>

      {invoice.notes && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-sm text-slate-800">
          {invoice.notes}
        </div>
      )}

      <h2 className="text-lg font-semibold">Payments</h2>
      <div className="bg-white rounded border border-slate-200 divide-y">
        {payments.map((p: any) => (
          <div key={p.id} className="px-4 py-3 text-sm flex justify-between">
            <span>
              {p.payment_method} — {p.reference_no || '—'}
            </span>
            <span className="font-medium">{formatPeso(p.amount_cents)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
