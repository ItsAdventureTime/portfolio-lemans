import { getDemoRole } from '@/lib/actor';
import { getAccountingSummary } from '@/lib/api';
import { formatPeso } from '@/lib/money';
import { hasPermission } from '@/lib/roles';
import AccessDenied from '@/components/AccessDenied';

export default async function AccountingPage() {
  const role = await getDemoRole();
  if (!hasPermission(role, 'viewAccounting')) {
    return <AccessDenied role={role} requiredCapability="viewAccounting" />;
  }
  const data = await getAccountingSummary(role);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Accounting Summary</h1>

      <section className="bg-white rounded border border-slate-200 p-4">
        <h2 className="text-lg font-semibold mb-3">Customers</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">No</th>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">TIN</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.customers.map((c: any) => (
              <tr key={c.id}>
                <td className="px-4 py-2">{c.customer_no}</td>
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.tin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-white rounded border border-slate-200 p-4">
        <h2 className="text-lg font-semibold mb-3">Invoices</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">Invoice No</th>
              <th className="text-left px-4 py-2">Customer</th>
              <th className="text-left px-4 py-2">Total</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.invoices.map((inv: any) => (
              <tr key={inv.id}>
                <td className="px-4 py-2">{inv.invoice_no}</td>
                <td className="px-4 py-2">{inv.customer_name}</td>
                <td className="px-4 py-2">{formatPeso(inv.total_cents)}</td>
                <td className="px-4 py-2">{inv.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
