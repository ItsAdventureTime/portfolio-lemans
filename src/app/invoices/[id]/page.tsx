import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { recordCustomerPayment } from '@/lib/actions/billing';

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = await db.serviceInvoice.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      jo: { include: { items: true } },
      payments: true,
    },
  });
  if (!invoice) notFound();

  const inv = invoice;
  const remaining = inv.total - inv.amountPaid;

  async function paymentFormAction(formData: FormData) {
    'use server';
    await recordCustomerPayment(inv.id, {
      amount: Number(formData.get('amount')),
      paymentMethod: String(formData.get('paymentMethod')),
      referenceNo: String(formData.get('referenceNo') || ''),
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-900">{invoice.invoiceNo}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {invoice.customer.name} • TIN: {invoice.customer.tin ?? 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">VAT 12%</p>
            <p className="text-sm font-bold font-mono">₱{invoice.vatAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Invoice Line Items</h3>
        </div>
        <div className="p-5">
          {invoice.jo?.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between py-2 text-xs border-b border-slate-100"
            >
              <span className="text-slate-700">{item.description}</span>
              <span className="font-mono">₱{item.netAmount.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 font-bold text-sm">
            <span className="text-slate-900">Total Due</span>
            <span className="font-mono text-brand-primary">₱{invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {remaining > 0.01 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Record Customer Payment</h3>
          <form action={paymentFormAction} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              name="amount"
              type="number"
              step="0.01"
              max={remaining}
              placeholder="Amount"
              required
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <input
              name="paymentMethod"
              placeholder="Method"
              required
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <input
              name="referenceNo"
              placeholder="Reference #"
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-semibold hover:bg-brand-hover"
            >
              Record Payment
            </button>
          </form>
        </div>
      )}

      <div className="text-center text-[11px] text-slate-500 border-t border-slate-200 pt-4">
        Le Mans Service Plus OPC • Single Source of Truth Job Order Management System
      </div>
    </div>
  );
}
