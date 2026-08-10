import { getDemoRole } from '@/lib/actor';
import { listJobOrders, getJobOrder } from '@/lib/api';
import Link from 'next/link';

export default async function JobOrdersPage() {
  const role = await getDemoRole();
  const jobOrders = await listJobOrders(role);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Job Orders</h1>
      <div className="bg-white rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">JO No</th>
              <th className="text-left px-4 py-2">Customer</th>
              <th className="text-left px-4 py-2">Vehicle</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Technician</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {jobOrders.map((jo: any) => (
              <tr key={jo.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link
                    href={`/job-orders/${jo.jo_no}`}
                    className="text-brand-primary hover:underline"
                  >
                    {jo.jo_no}
                  </Link>
                </td>
                <td className="px-4 py-2">{jo.customer_name}</td>
                <td className="px-4 py-2">{jo.vehicle_plate}</td>
                <td className="px-4 py-2">{jo.status}</td>
                <td className="px-4 py-2">{jo.technician || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
