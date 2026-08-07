'use client';

import React from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, Shield } from 'lucide-react';

export default function RepairOrderPrintView({ params }: { params: { id: string } }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Non-printable Action Bar */}
      <div className="print:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <Link
          href="/job-orders"
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Job Orders</span>
        </Link>

        <div className="flex items-center space-x-3">
          <Link
            href={`/job-costing/${params.id}`}
            className="px-3.5 py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            View Job Cost Sheet
          </Link>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-xl hover:bg-brand-hover transition-colors shadow-sm inline-flex items-center space-x-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>Print Repair Order</span>
          </button>
        </div>
      </div>

      {/* Authentic Printable Document Container matching photo_2026-08-03_00-36-12.jpg */}
      <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-md max-w-4xl mx-auto font-sans text-xs text-slate-900 leading-normal">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 border-2 border-slate-900 bg-white flex flex-col items-center justify-center font-bold text-center">
              <span className="text-[9px] text-red-600 tracking-tighter leading-none">LeMans</span>
              <span className="text-[12px] font-black leading-none">SP</span>
              <span className="text-[7px] text-slate-600 leading-none">EST 2020</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                Le Mans Service Plus OPC
              </h1>
              <p className="text-[11px] text-slate-700">Highway Pampang, Angeles City, Pampanga</p>
              <p className="text-[11px] text-slate-700">Email: lemans@gmail.com</p>
              <p className="text-[11px] text-slate-700">Tel and Fax no.: (045) 425-0117 / 0126</p>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-black tracking-wider text-slate-900 uppercase">
              REPAIR ORDER
            </h2>
            <div className="mt-1">
              <p className="text-xs font-bold text-slate-900">
                CONTROL NO.: <span className="text-red-700 font-mono text-sm">{params.id || 'RA0003973'}</span>
              </p>
              <p className="text-[11px] text-slate-700">CUBE TOPPER NO.: <span className="font-bold">08</span></p>
            </div>
          </div>
        </div>

        {/* Info Grid Matrix */}
        <div className="border border-slate-900 divide-y divide-slate-900 mb-4 text-[11px]">
          <div className="grid grid-cols-12 divide-x divide-slate-900">
            <div className="col-span-3 p-1.5 bg-slate-50">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Customer No.</span>
              <span className="font-bold text-slate-900">006500</span>
            </div>
            <div className="col-span-5 p-1.5">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Customer Name and Address</span>
              <span className="font-bold text-slate-900 block leading-tight">
                ACCUSTANDARD MEDICAL AND DIAGNOSTIC CORP.
              </span>
              <span className="text-[10px] text-slate-600 block leading-tight">
                EL DECARO BLDG. B2L2 ST. JUDE SUB. SAN AGUSTIN CITY OF SAN FERNANDO PAMPANGA
              </span>
            </div>
            <div className="col-span-2 p-1.5 bg-slate-50">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Plate No.</span>
              <span className="font-bold text-slate-900">CBE7864</span>
            </div>
            <div className="col-span-2 p-1.5">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Advisor</span>
              <span className="font-bold text-slate-900">JEFFREY P. PERIN</span>
            </div>
          </div>

          <div className="grid grid-cols-12 divide-x divide-slate-900">
            <div className="col-span-3 p-1.5">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Mode of Payment</span>
              <span>Account</span>
            </div>
            <div className="col-span-3 p-1.5">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Mobile No.</span>
              <span>0917-136-6569</span>
            </div>
            <div className="col-span-3 p-1.5">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Year / Make</span>
              <span>2023 / TOYOTA</span>
            </div>
            <div className="col-span-3 p-1.5">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Model / Color</span>
              <span>LITEACE / WHITE</span>
            </div>
          </div>

          <div className="grid grid-cols-12 divide-x divide-slate-900">
            <div className="col-span-6 p-1.5">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Representative Name</span>
              <span className="font-semibold">C/O SIR JOSHUA TOCA</span>
            </div>
            <div className="col-span-6 p-1.5">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">VIN / Chassis No.</span>
              <span className="font-mono">MHKB3FE10NK001080</span>
            </div>
          </div>
        </div>

        {/* Task & Line Items Table */}
        <table className="w-full border border-slate-900 text-left text-[11px] mb-4">
          <thead className="bg-slate-100 border-b border-slate-900 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-1.5 border-r border-slate-900">Line</th>
              <th className="p-1.5 border-r border-slate-900">Description</th>
              <th className="p-1.5 border-r border-slate-900 text-right">Qty</th>
              <th className="p-1.5 border-r border-slate-900 text-right">Unit Price</th>
              <th className="p-1.5 border-r border-slate-900 text-right">Discount</th>
              <th className="p-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {/* Task 1 */}
            <tr className="bg-slate-50 font-bold">
              <td className="p-1.5 border-r border-slate-900">C</td>
              <td colSpan={5} className="p-1.5">Perform 125,000 kilometers Check up</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-slate-900 text-center font-bold">L</td>
              <td className="p-1.5 border-r border-slate-900">Service Labor</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">1</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">2,000.00</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">200.00</td>
              <td className="p-1.5 text-right font-mono font-bold">1,800.00</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-slate-900 text-center">P</td>
              <td className="p-1.5 border-r border-slate-900">MINERAL ENG OIL 15W-40 (WURTH)</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">4</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">363.52</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">0.00</td>
              <td className="p-1.5 text-right font-mono font-bold">1,454.08</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-slate-900 text-center">P</td>
              <td className="p-1.5 border-r border-slate-900">OIL FILTER VIC C-110</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">1</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">345.00</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">34.50</td>
              <td className="p-1.5 text-right font-mono font-bold">310.50</td>
            </tr>

            {/* Task 2 */}
            <tr className="bg-slate-50 font-bold">
              <td className="p-1.5 border-r border-slate-900">C</td>
              <td colSpan={5} className="p-1.5">Cleaning of Throttle Valve and Replace Spark Plugs</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-slate-900 text-center font-bold">L</td>
              <td className="p-1.5 border-r border-slate-900">Service Labor</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">2</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">600.00</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">120.00</td>
              <td className="p-1.5 text-right font-mono font-bold">1,080.00</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-slate-900 text-center">P</td>
              <td className="p-1.5 border-r border-slate-900">SPARK PLUG (IRIDIUM)</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">4</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">1,560.00</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">624.00</td>
              <td className="p-1.5 text-right font-mono font-bold">5,616.00</td>
            </tr>
          </tbody>
        </table>

        {/* Cost Summary Box matching Client Layout */}
        <div className="flex justify-end mb-6">
          <div className="w-64 border border-slate-900 text-[11px] divide-y divide-slate-900">
            <div className="flex justify-between p-1.5">
              <span className="font-bold uppercase">LABOR</span>
              <span className="font-mono font-bold">Php 2,880.00</span>
            </div>
            <div className="flex justify-between p-1.5">
              <span className="font-bold uppercase">PARTS</span>
              <span className="font-mono font-bold">Php 13,051.49</span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-100">
              <span className="font-black uppercase">TOTAL</span>
              <span className="font-mono font-black text-sm text-red-700">Php 15,931.49</span>
            </div>
          </div>
        </div>

        {/* Sign-off Blocks */}
        <div className="grid grid-cols-4 gap-2 border border-slate-900 p-2 text-[10px] text-center">
          <div className="border-r border-slate-400 pr-1">
            <p className="font-bold text-slate-700">Prepared By:</p>
            <div className="h-8"></div>
            <p className="font-bold underline">JEFFREY P. PERIN</p>
            <p className="text-[9px] text-slate-500">Service Advisor</p>
          </div>
          <div className="border-r border-slate-400 pr-1">
            <p className="font-bold text-slate-700">Checked By:</p>
            <div className="h-8"></div>
            <p className="font-bold underline">WARRANTY PROCESSOR</p>
            <p className="text-[9px] text-slate-500">Service Quality</p>
          </div>
          <div className="border-r border-slate-400 pr-1">
            <p className="font-bold text-slate-700">Approved By:</p>
            <div className="h-8"></div>
            <p className="font-bold underline">SERVICE HEAD</p>
            <p className="text-[9px] text-slate-500">General Manager</p>
          </div>
          <div>
            <p className="font-bold text-slate-700">Acknowledged By:</p>
            <div className="h-8"></div>
            <p className="font-bold underline">ACCUSTANDARD MEDICAL</p>
            <p className="text-[9px] text-slate-500">Customer Signature</p>
          </div>
        </div>

        <p className="text-[9px] text-slate-500 mt-2 text-center">
          THIS IS A SYSTEM GENERATED REPAIR ORDER • NOT VALID FOR CLAIMING INPUT TAX
        </p>
      </div>
    </div>
  );
}
