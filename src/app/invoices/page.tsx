import { db } from '@/lib/db';
import Link from 'next/link';
import { FileText, Plus, Wallet } from 'lucide-react';
import { generateServiceInvoice } from '@/lib/actions/billing';

export default async function InvoicesPage() {
  const invoices = await db.serviceInvoice.findMany({
    include: { customer: true, jo: true, payments: true },
    orderBy: { issueDate: 'desc' },
  });

  const billableJos = await db.jobOrder.findMany({
    where: { status: 'COMPLETED', serviceInvoice: null },
    include: { customer: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-slate-700" />
            <span>Service Invoices & Payments</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate VAT-inclusive invoices from completed job orders and record customer payments.
          </p>
        </div>
      </div>

      {billableJos.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Ready to Invoice (Completed JOs)</h3>
          </div>
          <div className="p-5 space-y-4">
            {billableJos.map((jo) => {
              async function invoiceFormAction() {
                'use server';
                await generateServiceInvoice(jo.id);
              }

              return (
                <div
                  key={jo.id}
                  className="flex items-center justify-between border border-slate-200 rounded-xl p-4"
                >
                  <div>
                    <span className="font-bold text-slate-900">{jo.joNo}</span>
                    <p className="text-xs text-slate-500">{jo.customer.name}</p>
                  </div>
                  <form action={invoiceFormAction}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center space-x-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Generate Invoice</span>
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Invoice List</h3>
        </div>
        <div className="p-5 space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">{invoice.invoiceNo}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {invoice.status}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold">₱{invoice.total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {invoice.customer.name} • JO: {invoice.jo?.joNo ?? 'N/A'} • Paid: ₱
                {invoice.amountPaid.toFixed(2)}
              </p>
              <Link
                href={`/invoices/${invoice.id}`}
                className="inline-flex items-center mt-3 text-xs font-semibold text-brand-primary hover:text-brand-hover"
              >
                <Wallet className="h-3.5 w-3.5 mr-1" />
                Record Payment
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
