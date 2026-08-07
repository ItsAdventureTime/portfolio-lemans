import { db } from '@/lib/db';
import Link from 'next/link';
import { FileText, ArrowRight, Plus } from 'lucide-react';
import { convertQuoteToJobOrder, createSalesQuotation } from '@/lib/actions/job-orders';

export default async function QuotationsPage() {
  const [customers, quotes] = await Promise.all([
    db.customer.findMany({
      include: { vehicles: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.salesQuotation.findMany({
      include: { customer: true, vehicle: true, items: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  async function createFormAction(formData: FormData) {
    'use server';
    const raw = String(formData.get('items') || '');
    const lines = raw
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [type, description, qty, unitPrice, discount] = line.split('|').map((s) => s.trim());
        return {
          itemType: (type?.toUpperCase() as 'LABOR' | 'PARTS' | 'MISC') || 'PARTS',
          description,
          quantity: Number(qty) || 1,
          unitPrice: Number(unitPrice) || 0,
          discount: Number(discount) || 0,
        };
      })
      .filter((i) => i.description);

    await createSalesQuotation({
      customerId: String(formData.get('customerId')),
      vehicleId: String(formData.get('vehicleId')),
      advisor: String(formData.get('advisor')),
      items: lines,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-slate-700" />
            <span>Sales Quotations</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Create labor &amp; parts estimates. Convert approved quotes into Job Orders.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">New Sales Quote</h3>
        <form action={createFormAction} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              name="customerId"
              required
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerNo} - {c.name}
                </option>
              ))}
            </select>
            <select
              name="vehicleId"
              required
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            >
              <option value="">Select Vehicle</option>
              {customers.flatMap((c) =>
                c.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNo} - {v.makeModel}
                  </option>
                ))
              )}
            </select>
            <input
              name="advisor"
              placeholder="Service Advisor"
              required
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
          </div>
          <textarea
            name="items"
            placeholder={`Line format: type | description | qty | unitPrice | discount\nExample: labor | Service labor | 1 | 2000 | 200`}
            required
            rows={4}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#d32f2f] text-white rounded-xl text-sm font-semibold hover:bg-[#b71c1c] flex items-center space-x-1 whitespace-nowrap h-9"
          >
            <Plus className="h-4 w-4" />
            <span>Create Quote</span>
          </button>
        </form>
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
                  <span className="text-lg font-bold text-slate-900">{quote.quoteNo}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {quote.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Customer: {quote.customer.name} • Vehicle: {quote.vehicle.makeModel} (
                  {quote.vehicle.plateNo})
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {quote.status === 'APPROVED' && (
                  <form action={convertFormAction}>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#d32f2f] text-white rounded-xl text-sm font-semibold hover:bg-[#b71c1c] transition-colors shadow-sm flex items-center space-x-1.5 whitespace-nowrap h-9"
                    >
                      <span>Convert to Job Order</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-base">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                      Unit Price
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                      Net Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {quote.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 font-bold text-blue-600">{item.itemType}</td>
                      <td className="px-6 py-4">{item.description}</td>
                      <td className="px-6 py-4 text-right font-mono">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-mono">
                        ₱{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold">
                        ₱{item.netAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right">
                      Quote Grand Total:
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-base text-[#d32f2f]">
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
