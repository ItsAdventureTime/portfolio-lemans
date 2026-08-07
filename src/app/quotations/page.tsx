'use client';

import React, { useState } from 'react';
import { FileText, ArrowRight, CheckCircle2, Car, User, Plus } from 'lucide-react';
import Link from 'next/link';

export default function QuotationsPage() {
  const [converted, setConverted] = useState(false);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-slate-700" />
            <span>Sales Quotations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create labor & parts estimates. Convert approved quotes into Job Orders.
          </p>
        </div>
        <button className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-xl hover:bg-brand-hover transition-colors shadow-sm flex items-center space-x-1.5">
          <Plus className="h-4 w-4" />
          <span>New Sales Quote</span>
        </button>
      </div>

      {/* Quote Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-slate-900">SQ-2026-0042</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                converted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {converted ? 'CONVERTED TO JO' : 'APPROVED BY CLIENT'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Customer: ACCUSTANDARD MEDICAL • Vehicle: 2023 TOYOTA LITEACE (CBE7864)
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {!converted ? (
              <button
                onClick={() => setConverted(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <span>Convert to Job Order</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href="/job-orders/RA0003973"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>View Generated JO (RA0003973)</span>
              </Link>
            )}
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">Net Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="px-4 py-3 font-bold text-blue-600">LABOR</td>
                <td className="px-4 py-3 font-medium">Perform 125,000 kilometers Check up Service Labor</td>
                <td className="px-4 py-3 text-right font-mono">1</td>
                <td className="px-4 py-3 text-right font-mono">₱2,000.00</td>
                <td className="px-4 py-3 text-right font-mono">₱200.00</td>
                <td className="px-4 py-3 text-right font-mono font-bold">₱1,800.00</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-amber-600">PARTS</td>
                <td className="px-4 py-3">MINERAL ENG OIL 15W-40 (WURTH)</td>
                <td className="px-4 py-3 text-right font-mono">4</td>
                <td className="px-4 py-3 text-right font-mono">₱363.52</td>
                <td className="px-4 py-3 text-right font-mono">₱0.00</td>
                <td className="px-4 py-3 text-right font-mono font-bold">₱1,454.08</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-amber-600">PARTS</td>
                <td className="px-4 py-3">OIL FILTER VIC C-110</td>
                <td className="px-4 py-3 text-right font-mono">1</td>
                <td className="px-4 py-3 text-right font-mono">₱345.00</td>
                <td className="px-4 py-3 text-right font-mono">₱34.50</td>
                <td className="px-4 py-3 text-right font-mono font-bold">₱310.50</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-blue-600">LABOR</td>
                <td className="px-4 py-3 font-medium">Cleaning of Throttle Valve and Replace Spark Plugs</td>
                <td className="px-4 py-3 text-right font-mono">2</td>
                <td className="px-4 py-3 text-right font-mono">₱600.00</td>
                <td className="px-4 py-3 text-right font-mono">₱120.00</td>
                <td className="px-4 py-3 text-right font-mono font-bold">₱1,080.00</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-amber-600">PARTS</td>
                <td className="px-4 py-3">SPARK PLUG (IRIDIUM)</td>
                <td className="px-4 py-3 text-right font-mono">4</td>
                <td className="px-4 py-3 text-right font-mono">₱1,560.00</td>
                <td className="px-4 py-3 text-right font-mono">₱624.00</td>
                <td className="px-4 py-3 text-right font-mono font-bold">₱5,616.00</td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right">Quote Grand Total:</td>
                <td className="px-4 py-3 text-right font-mono text-sm text-brand-primary">₱15,931.49</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
