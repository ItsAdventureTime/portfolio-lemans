import React from 'react';
import Link from 'next/link';
import {
  Wrench,
  FileText,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Car,
  UserCheck,
  Plus,
} from 'lucide-react';

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Welcome Back, Operations Team 👋</h2>
          <p className="text-xs text-slate-500 mt-1">
            Le Mans Service Plus OPC • Highway Pampang, Angeles City Branch
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/customers"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <UserCheck className="h-4 w-4 text-slate-500" />
            <span>New Customer</span>
          </Link>
          <Link
            href="/quotations"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-hover transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Sales Quote</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards - ColdTrace Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Job Orders</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Wrench className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">12</span>
            <span className="text-xs font-semibold text-emerald-600">+15% vs last week</span>
          </div>
          <p className="text-[11px] text-slate-400">8 In Progress • 4 Pending Parts</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Quotations Value</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">₱142,500</span>
            <span className="text-xs font-semibold text-emerald-600">Optimal</span>
          </div>
          <p className="text-[11px] text-slate-400">5 Quotes Awaiting Approval</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Job Profitability</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">25.0%</span>
            <span className="text-xs font-semibold text-emerald-600">+2.4% Target</span>
          </div>
          <p className="text-[11px] text-slate-400">Average Net Profit Margin</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending GM Approvals</span>
            <span className="p-2 rounded-xl bg-rose-50 text-brand-primary">
              <CheckCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">3 Requests</span>
            <span className="text-xs font-semibold text-amber-600">Needs Review</span>
          </div>
          <p className="text-[11px] text-slate-400">2 Purchase Requests • 1 OPEX</p>
        </div>
      </div>

      {/* Main Operational Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Job Orders</h3>
            <p className="text-xs text-slate-500">Single Source of Truth Operational Log</p>
          </div>
          <Link
            href="/job-orders"
            className="text-xs font-semibold text-brand-primary hover:text-brand-hover flex items-center space-x-1"
          >
            <span>View All Job Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">RO / JO Number</th>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Vehicle / Plate</th>
                <th className="px-5 py-3.5">Service Advisor</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Billed Amount</th>
                <th className="px-5 py-3.5 text-right">Est Profit</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-bold text-slate-900">RA0003973</td>
                <td className="px-5 py-4 font-medium text-slate-800">
                  ACCUSTANDARD MEDICAL AND DIAGNOSTIC CORP.
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center space-x-2">
                    <Car className="h-3.5 w-3.5 text-slate-400" />
                    <span>2023 TOYOTA LITEACE (CBE7864)</span>
                  </div>
                </td>
                <td className="px-5 py-4">JEFFREY P. PERIN</td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    IN PROGRESS
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">
                  ₱15,931.49
                </td>
                <td className="px-5 py-4 text-right font-mono font-bold text-emerald-600">
                  ₱3,981.49 (25.0%)
                </td>
                <td className="px-5 py-4 text-center">
                  <Link
                    href="/job-orders/RA0003973"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold text-[11px] transition-colors"
                  >
                    View RA
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
