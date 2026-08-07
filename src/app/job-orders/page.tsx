import React from 'react';
import Link from 'next/link';
import { Wrench, Car, User, ArrowRight } from 'lucide-react';

export default function JobOrdersListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-slate-700" />
            <span>Active Job Orders</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Single Source of Truth Operational Registry
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-base font-bold text-slate-900">RA0003973</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                IN PROGRESS
              </span>
              <span className="text-xs text-slate-400">Cube Topper #08</span>
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Customer: ACCUSTANDARD MEDICAL AND DIAGNOSTIC CORP.
            </p>
            <div className="flex items-center space-x-4 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <Car className="h-3.5 w-3.5 text-slate-400" />
                <span>2023 TOYOTA LITEACE (CBE7864)</span>
              </span>
              <span className="flex items-center space-x-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Advisor: JEFFREY P. PERIN</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col md:items-end space-y-2">
            <span className="text-sm font-bold font-mono text-slate-900">
              ₱15,931.49
            </span>
            <div className="flex items-center space-x-2">
              <Link
                href="/job-orders/RA0003973"
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center space-x-1"
              >
                <span>Printable Repair Order</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
