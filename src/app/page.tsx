import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
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
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export default async function DashboardOverview() {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) {
    redirect('/login');
  }

  const activeJoCount = await db.jobOrder.count({
    where: { status: { in: ['IN_PROGRESS', 'PARTS_PENDING', 'APPROVED'] } },
  });

  const completedJoCount = await db.jobOrder.count({
    where: { status: 'COMPLETED' },
  });

  const quotationsAgg = await db.salesQuotation.aggregate({
    _sum: { netTotal: true },
    where: { status: { in: ['DRAFT', 'APPROVED'] } },
  });

  const pendingApprovals =
    (await db.purchaseRequest.count({ where: { status: 'PENDING_APPROVAL' } })) +
    (await db.opexRequest.count({ where: { status: 'PENDING_APPROVAL' } }));

  const recentJos = await db.jobOrder.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { customer: true, vehicle: true },
  });

  const totalBilled = await db.jobOrder.aggregate({
    _sum: { billedAmount: true },
  });

  const totalActual = await db.jobOrder.aggregate({
    _sum: { actualLaborCost: true, actualPartsCost: true },
  });

  const totalPartsAllocations = await db.supplierInvoiceAllocation.groupBy({
    by: ['joId'],
    _sum: { amount: true },
  });

  const totalAllocatedExpenses = totalPartsAllocations.reduce(
    (sum, a) => sum + (a._sum.amount ?? 0),
    0
  );

  const billedTotal = totalBilled._sum.billedAmount ?? 0;
  const actualCostTotal =
    (totalActual._sum.actualLaborCost ?? 0) +
    (totalActual._sum.actualPartsCost ?? 0) +
    totalAllocatedExpenses;
  const netProfitTotal = billedTotal - actualCostTotal;
  const profitMarginPercent = billedTotal > 0 ? (netProfitTotal / billedTotal) * 100 : 0;

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

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Job Orders</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Wrench className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{activeJoCount}</span>
          </div>
          <p className="text-[11px] text-slate-400">{completedJoCount} Completed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Quotations Value</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">
              ₱
              {(quotationsAgg._sum.netTotal ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Pending & Draft Quotes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Job Profitability</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">
              {profitMarginPercent.toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Net Profit ₱
            {netProfitTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending GM Approvals</span>
            <span className="p-2 rounded-xl bg-rose-50 text-brand-primary">
              <CheckCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{pendingApprovals} Requests</span>
          </div>
          <p className="text-[11px] text-slate-400">PRs & OPEX awaiting review</p>
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
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentJos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No job orders found.
                  </td>
                </tr>
              )}
              {recentJos.map((jo) => (
                <tr key={jo.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">{jo.joNo}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{jo.customer.name}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-2">
                      <Car className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {jo.vehicle.makeModel} ({jo.vehicle.plateNo})
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">{jo.advisor}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {jo.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">
                    ₱{jo.billedAmount.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Link
                      href={`/job-orders/${jo.joNo}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold text-[11px] transition-colors"
                    >
                      View RA
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
