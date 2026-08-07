import { db } from '@/lib/db';
import Link from 'next/link';
import { Users, Car, Plus } from 'lucide-react';
import { createCustomerAndVehicle } from '@/lib/actions/job-orders';

export default async function CustomersPage() {
  const customers = await db.customer.findMany({
    include: { vehicles: true },
    orderBy: { createdAt: 'desc' },
  });

  async function createFormAction(formData: FormData) {
    'use server';
    await createCustomerAndVehicle({
      customer: {
        customerNo: String(formData.get('customerNo')),
        name: String(formData.get('name')),
        tin: String(formData.get('tin') || ''),
        address: String(formData.get('address') || ''),
        phone: String(formData.get('phone') || ''),
        email: String(formData.get('email') || ''),
      },
      vehicle: {
        plateNo: String(formData.get('plateNo')),
        makeModel: String(formData.get('makeModel')),
        vinChassis: String(formData.get('vinChassis') || ''),
        engineNo: String(formData.get('engineNo') || ''),
        year: String(formData.get('year') || ''),
        color: String(formData.get('color') || ''),
        odometer: Number(formData.get('odometer') || 0),
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="h-5 w-5 text-slate-700" />
            <span>Customer & Vehicle Directory</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Maintain customer records and linked vehicle service profiles.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Register Customer & Vehicle</h3>
        <form action={createFormAction} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              name="customerNo"
              placeholder="Customer No"
              required
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
            <input
              name="name"
              placeholder="Customer / Company Name"
              required
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
            <input
              name="tin"
              placeholder="TIN"
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              name="address"
              placeholder="Address"
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
            <input
              name="phone"
              placeholder="Phone"
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
            <input
              name="email"
              placeholder="Email"
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              name="plateNo"
              placeholder="Plate No"
              required
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
            <input
              name="makeModel"
              placeholder="Year / Make / Model"
              required
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
            <input
              name="vinChassis"
              placeholder="VIN / Chassis"
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
            <input
              name="engineNo"
              placeholder="Engine No"
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              name="year"
              placeholder="Year"
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
            <input
              name="color"
              placeholder="Color"
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
            <input
              name="odometer"
              type="number"
              placeholder="Odometer"
              className="px-3 py-2 rounded-xl border border-slate-300 text-base"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#d32f2f] text-white rounded-xl text-sm font-semibold hover:bg-[#b71c1c] flex items-center space-x-1 whitespace-nowrap h-9"
          >
            <Plus className="h-4 w-4" />
            <span>Register Customer</span>
          </button>
        </form>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <h3 className="text-base font-bold text-slate-900">No Customers Found</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-900 text-white">
                      #{customer.customerNo}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{customer.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{customer.address}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Registered Vehicles ({customer.vehicles.length})
                </h4>
                {customer.vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold">
                        <Car className="h-5 w-5 text-brand-primary" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-bold text-slate-900">
                            {vehicle.makeModel}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-bold bg-slate-900 text-white rounded">
                            {vehicle.plateNo}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                          VIN: {vehicle.vinChassis} • Engine: {vehicle.engineNo}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
