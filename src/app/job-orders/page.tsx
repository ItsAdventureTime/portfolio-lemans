import { db } from '@/lib/db';
import Link from 'next/link';
import { Wrench, Car, User, ArrowRight } from 'lucide-react';

export default async function JobOrdersListPage() {
  const jobOrders = await db.jobOrder.findMany({
    include: { customer: true, vehicle: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-slate-700" />
            <span>Active Job Orders</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Single Source of Truth Operational Registry</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        {jobOrders.map((jo) => (
          <div
            key={jo.id}
            className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-base font-bold text-slate-900">{jo.joNo}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {jo.status}
                </span>
                {jo.cubeTopperNo && (
                  <span className="text-xs text-slate-400">Cube Topper #{jo.cubeTopperNo}</span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-800">Customer: {jo.customer.name}</p>
              <div className="flex items-center space-x-4 text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <Car className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {jo.vehicle.makeModel} ({jo.vehicle.plateNo})
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>Advisor: {jo.advisor}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col md:items-end space-y-2">
              <span className="text-sm font-bold font-mono text-slate-900">
                ₱{jo.billedAmount.toFixed(2)}
              </span>
              <Link
                href={`/job-orders/${jo.joNo}`}
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center space-x-1"
              >
                <span>View JO</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
