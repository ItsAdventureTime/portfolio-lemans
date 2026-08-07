import { headers } from 'next/headers';
import { db } from '@/lib/db';
import Link from 'next/link';
import { FileText, ArrowRight, Plus } from 'lucide-react';
import { convertQuoteToJobOrder } from '@/lib/actions/job-orders';

export default async function QuotationsPage() {
  const quotes = await db.salesQuotation.findMany({
    include: { customer: true, vehicle: true, items: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-slate-700" />
            <span>Sales Quotations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create labor & parts estimates. Convert approved quotes into Job Orders.
          </p>
        </div>
        <button className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-xl hover:bg-brand-hover transition-colors shadow-sm flex items-center space-x-1.5">
          <Plus className="h-4 w-4" />
          <span>New Sales Quote</span>
        </button>
      </div>

      {quotes.map((quote) => {
        async function convertFormAction() {
          'use server';
          await convertQuoteToJobOrder(quote.id);
        }

        return (
          <div
            key={quote.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-slate-900">{quote.quoteNo}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {quote.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Customer: {quote.customer.name} • Vehicle: {quote.vehicle.makeModel} (
                  {quote.vehicle.plateNo})
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {quote.status === 'APPROVED' && (
                  <form action={convertFormAction}>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm flex items-center space-x-1.5"
                    >
                      <span>Convert to Job Order</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Net Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {quote.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-bold text-blue-600">{item.itemType}</td>
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right font-mono">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        ₱{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        ₱{item.netAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right">
                      Quote Grand Total:
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-brand-primary">
                      ₱{quote.netTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
