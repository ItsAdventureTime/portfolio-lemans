import { getDemoRole } from '@/lib/actor';
import { listCustomers, createCustomerAndVehicle } from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export default async function CustomersPage() {
  const role = await getDemoRole();
  const customers = await listCustomers(role);
  const canCreate = hasPermission(role, 'customerCreate');

  async function createFormAction(formData: FormData) {
    'use server';
    const customer = {
      customerNo: String(formData.get('customerNo')),
      name: String(formData.get('name')),
      tin: String(formData.get('tin')),
      address: String(formData.get('address')),
      phone: String(formData.get('phone')),
      email: String(formData.get('email')),
    };
    const vehicle = {
      plateNo: String(formData.get('plateNo')),
      makeModel: String(formData.get('makeModel')),
      vinChassis: String(formData.get('vinChassis')),
      engineNo: String(formData.get('engineNo')),
      year: String(formData.get('year')),
      color: String(formData.get('color')),
      odometer: Number(formData.get('odometer')),
    };
    const currentRole = (await import('@/lib/actor')).getDemoRole();
    await createCustomerAndVehicle({ customer, vehicle }, await currentRole);
    revalidatePath('/customers');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Customers & Vehicles</h1>

      {canCreate && (
        <form
          action={createFormAction}
          className="bg-white p-4 rounded border border-slate-200 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              name="customerNo"
              placeholder="Customer No"
              required
              className="border rounded px-3 py-2"
            />
            <input name="name" placeholder="Name" required className="border rounded px-3 py-2" />
            <input name="tin" placeholder="TIN" className="border rounded px-3 py-2" />
            <input name="address" placeholder="Address" className="border rounded px-3 py-2" />
            <input name="phone" placeholder="Phone" className="border rounded px-3 py-2" />
            <input name="email" placeholder="Email" className="border rounded px-3 py-2" />
            <input
              name="plateNo"
              placeholder="Plate No"
              required
              className="border rounded px-3 py-2"
            />
            <input
              name="makeModel"
              placeholder="Make/Model"
              required
              className="border rounded px-3 py-2"
            />
            <input
              name="vinChassis"
              placeholder="VIN/Chassis"
              className="border rounded px-3 py-2"
            />
            <input name="engineNo" placeholder="Engine No" className="border rounded px-3 py-2" />
            <input name="year" placeholder="Year" className="border rounded px-3 py-2" />
            <input name="color" placeholder="Color" className="border rounded px-3 py-2" />
            <input
              name="odometer"
              type="number"
              placeholder="Odometer"
              className="border rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-hover"
          >
            Add Customer & Vehicle
          </button>
        </form>
      )}

      <div className="bg-white rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">Customer No</th>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Phone</th>
              <th className="text-left px-4 py-2">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((c: any) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/customers/${c.id}`} className="text-brand-primary hover:underline">
                    {c.customer_no}
                  </Link>
                </td>
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.phone}</td>
                <td className="px-4 py-2">{c.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
