import { getDemoRole } from '@/lib/actor';
import { getCustomer, listVehiclesByCustomer } from '@/lib/api';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getDemoRole();
  const [customer, vehicles] = await Promise.all([
    getCustomer(id, role),
    listVehiclesByCustomer(id, role),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{customer.name}</h1>
      <div className="bg-white p-4 rounded border border-slate-200 space-y-2 text-sm">
        <p>
          <span className="font-medium">Customer No:</span> {customer.customer_no}
        </p>
        <p>
          <span className="font-medium">TIN:</span> {customer.tin}
        </p>
        <p>
          <span className="font-medium">Address:</span> {customer.address}
        </p>
        <p>
          <span className="font-medium">Phone:</span> {customer.phone}
        </p>
        <p>
          <span className="font-medium">Email:</span> {customer.email}
        </p>
      </div>
      <h2 className="text-lg font-semibold">Vehicles</h2>
      <div className="bg-white rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">Plate</th>
              <th className="text-left px-4 py-2">Make/Model</th>
              <th className="text-left px-4 py-2">Year</th>
              <th className="text-left px-4 py-2">Color</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {vehicles.map((v: any) => (
              <tr key={v.id}>
                <td className="px-4 py-2">{v.plate_no}</td>
                <td className="px-4 py-2">{v.make_model}</td>
                <td className="px-4 py-2">{v.year}</td>
                <td className="px-4 py-2">{v.color}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
