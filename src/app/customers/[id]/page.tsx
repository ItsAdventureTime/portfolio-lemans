import { getDemoRole } from '@/lib/actor';
import { getCustomer, listVehiclesByCustomer } from '@/lib/api';
import { DataTable } from '@/components/ui';
import type { Vehicle } from '@/lib/types';

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
      <DataTable<Vehicle>
        items={vehicles}
        caption="Customer vehicles"
        emptyTitle="No vehicles"
        emptyDescription="This customer has no registered vehicles."
        columns={[
          { key: 'plate', header: 'Plate', render: (v) => v.plate_no },
          { key: 'makeModel', header: 'Make/Model', render: (v) => v.make_model },
          { key: 'year', header: 'Year', render: (v) => v.year || '—' },
          { key: 'color', header: 'Color', render: (v) => v.color || '—' },
        ]}
      />
    </div>
  );
}
