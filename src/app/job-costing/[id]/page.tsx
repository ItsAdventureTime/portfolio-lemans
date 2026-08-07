import React from 'react';
import Link from 'next/link';
import { DollarSign, TrendingUp, ArrowLeft, CheckCircle, Clock, FileText, ShoppingCart, CreditCard } from 'lucide-react';

export default function JobCostingPage({ params }: { params: { id: string } }) {
  const joData = {
    joNo: params.id || 'RA0003973',
    customer: 'ACCUSTANDARD MEDICAL AND DIAGNOSTIC CORP.',
    vehicle: '2023 TOYOTA LITEACE (CBE7864)',
    advisor: 'JEFFREY P. PERIN',
    status: 'IN_PROGRESS',
    
    // Revenue & Cost Metrics
    billedAmount: 15931.49,
    
    estimatedLabor: 2880.00,
    actualLaborCost: 2100.00,
    
    estimatedParts: 13051.49,
    actualPartsCost: 9850.00,
    
    allocatedExpenses: 0.00,
    
    totalActualCost: 11950.00, // 2100 + 9850
    netProfit: 3981.49,        // 15931.49 - 11950.00
    profitMargin: 25.0,        // (3981.49 / 15931.49) * 100
  };

  return (
    <div className="space-y-6">
      {/* Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/job-orders" className="text-slate-400 hover:text-slate-600">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <span>Job Cost Sheet — {joData.joNo}</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-Time Operational Profitability & Expense Allocation Matrix
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/job-orders/${joData.joNo}`}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
          >
            Printable Repair Order
          </Link>
        </div>
      </div>

      {/* Main KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Billed Customer Amount</span>
          <p className="text-2xl font-bold font-mono text-slate-900">
            ₱{joData.billedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400">Total Customer Invoiced</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total Actual Costs</span>
          <p className="text-2xl font-bold font-mono text-slate-900">
            ₱{joData.totalActualCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400">Labor + Parts + Expenses</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Net Operational Profit</span>
          <p className="text-2xl font-bold font-mono text-emerald-600">
            ₱{joData.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">Positive Margin</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Net Profit Margin (%)</span>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-emerald-600">{joData.profitMargin}%</p>
            <span className="text-xs font-semibold text-emerald-600">+5.0% vs target</span>
          </div>
          <span className="text-[11px] text-slate-400">Target Benchmark: 20%</span>
        </div>
      </div>

      {/* Deep-Dive Estimated vs Actual Cost Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
          Estimated vs. Actual Cost Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Cost Category</th>
                <th className="px-4 py-3 text-right">Estimated Cost</th>
                <th className="px-4 py-3 text-right">Actual Incurred Cost</th>
                <th className="px-4 py-3 text-right">Variance ($)</th>
                <th className="px-4 py-3 text-right">Variance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="px-4 py-4 font-bold text-slate-900">Technician Labor</td>
                <td className="px-4 py-4 text-right font-mono">₱2,880.00</td>
                <td className="px-4 py-4 text-right font-mono font-semibold text-slate-900">₱2,100.00</td>
                <td className="px-4 py-4 text-right font-mono font-semibold text-emerald-600">+₱780.00</td>
                <td className="px-4 py-4 text-right font-semibold text-emerald-600">Under Budget</td>
              </tr>
              <tr>
                <td className="px-4 py-4 font-bold text-slate-900">Parts & Materials</td>
                <td className="px-4 py-4 text-right font-mono">₱13,051.49</td>
                <td className="px-4 py-4 text-right font-mono font-semibold text-slate-900">₱9,850.00</td>
                <td className="px-4 py-4 text-right font-mono font-semibold text-emerald-600">+₱3,201.49</td>
                <td className="px-4 py-4 text-right font-semibold text-emerald-600">Under Budget</td>
              </tr>
              <tr>
                <td className="px-4 py-4 font-bold text-slate-900">Direct OPEX Allocations</td>
                <td className="px-4 py-4 text-right font-mono">₱0.00</td>
                <td className="px-4 py-4 text-right font-mono font-semibold text-slate-900">₱0.00</td>
                <td className="px-4 py-4 text-right font-mono text-slate-400">₱0.00</td>
                <td className="px-4 py-4 text-right text-slate-400">On Track</td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
              <tr>
                <td className="px-4 py-3">Totals:</td>
                <td className="px-4 py-3 text-right font-mono">₱15,931.49</td>
                <td className="px-4 py-3 text-right font-mono text-sm text-slate-900">₱11,950.00</td>
                <td className="px-4 py-3 text-right font-mono text-sm text-emerald-600">+₱3,981.49</td>
                <td className="px-4 py-3 text-right font-mono text-sm text-emerald-600">25.0% Profit</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Transaction Audit Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
          Job Order Audit Trail & Events Timeline
        </h3>

        <div className="space-y-4">
          <div className="flex items-start space-x-3 text-xs">
            <div className="p-2 rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Job Order Created & Approved — RA0003973</p>
              <p className="text-slate-500">Converted from Sales Quotation SQ-2026-0042 by Advisor JEFFREY P. PERIN</p>
              <span className="text-[10px] text-slate-400">2026-08-07 08:30 AM</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs">
            <div className="p-2 rounded-full bg-blue-100 text-blue-700 mt-0.5">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Parts Allocation Issued — PR-2026-018</p>
              <p className="text-slate-500">Wurth Engine Oil, VIC Oil Filter, Brake Cleaner allocated to RA0003973</p>
              <span className="text-[10px] text-slate-400">2026-08-07 09:15 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
