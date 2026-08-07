import { headers } from 'next/headers';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Users, Car, Plus } from 'lucide-react';

export default async function CustomersPage() {
  const customers = await db.customer.findMany({
    include: { vehicles: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="h-5 w-5 text-slate-700" />
            <span>Customer & Vehicle Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain customer records and linked vehicle service profiles.
          </p>
        </div>
        <button className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-semibold hover:bg-brand-hover transition-colors inline-flex items-center space-x-1.5 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>Register First Customer</span>
        </button>
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
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white">
                      #{customer.customerNo}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{customer.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{customer.address}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
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
                          <span className="text-sm font-bold text-slate-900">
                            {vehicle.makeModel}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-900 text-white rounded">
                            {vehicle.plateNo}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
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
