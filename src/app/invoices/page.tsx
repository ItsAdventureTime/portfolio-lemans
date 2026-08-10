import { getDemoRole } from '@/lib/actor';
import { listInvoices, createInvoiceFromJO, recordInvoicePayment } from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export default async function InvoicesPage() {
  const role = await getDemoRole();
  const invoices = await listInvoices(role);
  const canCreate = hasPermission(role, 'invoiceCreate');
  const canPay = hasPermission(role, 'invoiceRecordPayment');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Invoices & Collections</h1>

      {canCreate && (
        <form
          action={async (formData: FormData) => {
            'use server';
            const r = (await import('@/lib/actor')).getDemoRole();
            await createInvoiceFromJO(String(formData.get('joId')), '', await r);
            revalidatePath('/invoices');
          }}
          className="bg-white p-4 rounded border border-slate-200 flex gap-2"
        >
          <input
            name="joId"
            placeholder="Job Order ID"
            required
            className="border rounded px-3 py-2 flex-1"
          />
          <button className="bg-brand-primary text-white px-4 py-2 rounded">Create Invoice</button>
        </form>
      )}

      <div className="bg-white rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">Invoice No</th>
              <th className="text-left px-4 py-2">Customer</th>
              <th className="text-left px-4 py-2">Total</th>
              <th className="text-left px-4 py-2">Paid</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((inv: any) => (
              <tr key={inv.id}>
                <td className="px-4 py-2">
                  <Link href={`/invoices/${inv.id}`} className="text-brand-primary hover:underline">
                    {inv.invoice_no}
                  </Link>
                </td>
                <td className="px-4 py-2">{inv.customer_name}</td>
                <td className="px-4 py-2">₱{(inv.total_cents / 100).toFixed(2)}</td>
                <td className="px-4 py-2">₱{(inv.amount_paid_cents / 100).toFixed(2)}</td>
                <td className="px-4 py-2">{inv.status}</td>
                <td className="px-4 py-2">
                  {canPay && inv.status !== 'PAID' && (
                    <form
                      action={async (formData: FormData) => {
                        'use server';
                        const r = (await import('@/lib/actor')).getDemoRole();
                        await recordInvoicePayment(
                          inv.id,
                          {
                            amountCents: Math.round(Number(formData.get('amount')) * 100),
                            paymentMethod: String(formData.get('paymentMethod')),
                            referenceNo: String(formData.get('referenceNo')),
                            paidAt: new Date().toISOString(),
                          },
                          await r
                        );
                        revalidatePath('/invoices');
                      }}
                      className="flex gap-2"
                    >
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        className="border rounded px-2 py-1 w-24"
                      />
                      <input
                        name="paymentMethod"
                        placeholder="Method"
                        className="border rounded px-2 py-1 w-24"
                      />
                      <input
                        name="referenceNo"
                        placeholder="Ref"
                        className="border rounded px-2 py-1 w-24"
                      />
                      <button className="text-xs bg-brand-primary text-white px-2 py-1 rounded">
                        Pay
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
