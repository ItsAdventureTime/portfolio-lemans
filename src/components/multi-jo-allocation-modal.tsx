'use client';

import React, { useState, useMemo } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { formatPesoAmount } from '@/lib/money';

export interface JobOrderOption {
  id: string;
  joNo: string;
  customerName: string;
  makeModel: string;
}

export interface AllocationLine {
  joId: string;
  amount: number;
  description: string;
}

interface MultiJoAllocationModalProps {
  open: boolean;
  onClose: () => void;
  invoiceAmount: number;
  jobOrders: JobOrderOption[];
  initialAllocations?: AllocationLine[];
  onSave: (allocations: AllocationLine[]) => void;
}

export default function MultiJoAllocationModal({
  open,
  onClose,
  invoiceAmount,
  jobOrders,
  initialAllocations = [],
  onSave,
}: MultiJoAllocationModalProps) {
  const [lines, setLines] = useState<AllocationLine[]>(
    initialAllocations.length > 0 ? initialAllocations : [{ joId: '', amount: 0, description: '' }]
  );

  const addLine = () => setLines((prev) => [...prev, { joId: '', amount: 0, description: '' }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, patch: Partial<AllocationLine>) =>
    setLines((prev) => prev.map((line, i) => (i === idx ? { ...line, ...patch } : line)));

  const allocatedTotal = useMemo(
    () => lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0),
    [lines]
  );
  const remaining = invoiceAmount - allocatedTotal;
  const isBalanced = Math.abs(remaining) < 0.01;
  const isOverAllocated = remaining < -0.01;

  const handleSave = () => {
    if (isOverAllocated) return;
    const valid = lines.filter((l) => l.joId && l.amount > 0);
    onSave(valid);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Allocate Supplier Invoice Across Job Orders
            </h3>
            <p className="text-sm text-slate-500">
              Total invoice:{' '}
              <span className="font-mono font-semibold">{formatPesoAmount(invoiceAmount)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-11 w-11 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-base">
            <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Job Order</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right">
                  Amount
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {lines.map((line, idx) => (
                <tr key={idx} className="align-top">
                  <td className="px-4 py-3">
                    <select
                      value={line.joId}
                      onChange={(e) => updateLine(idx, { joId: e.target.value })}
                      className="min-h-11 w-full px-2 py-2 rounded-lg border border-slate-300 text-sm"
                    >
                      <option value="">Select Job Order</option>
                      {jobOrders.map((jo) => (
                        <option key={jo.id} value={jo.id}>
                          {jo.joNo} — {jo.customerName} • {jo.makeModel}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={line.description}
                      onChange={(e) => updateLine(idx, { description: e.target.value })}
                      placeholder="Allocation note"
                      className="min-h-11 w-full px-2 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        ₱
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.amount}
                        onChange={(e) => updateLine(idx, { amount: Number(e.target.value) })}
                        className="min-h-11 w-28 pl-6 pr-2 py-2 rounded-lg border border-slate-300 text-sm text-right"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      disabled={lines.length === 1}
                      className="inline-flex items-center justify-center h-11 w-11 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30"
                      aria-label="Remove allocation"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center justify-center h-12 px-4 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors whitespace-nowrap"
        >
          + Add Allocation Line
        </button>

        <div
          className={`flex items-center justify-between rounded-xl p-3 border ${
            isBalanced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : isOverAllocated
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {isBalanced ? (
              <>
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold">Fully allocated</span>
              </>
            ) : isOverAllocated ? (
              <>
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <span className="font-semibold">
                  Over-allocated by {formatPesoAmount(Math.abs(remaining))}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="font-semibold">
                  Remaining to allocate: {formatPesoAmount(remaining)}
                </span>
              </>
            )}
          </div>
          <div className="font-mono font-bold">
            {formatPesoAmount(allocatedTotal)} / {formatPesoAmount(invoiceAmount)}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-12 px-5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isBalanced}
            className="inline-flex items-center justify-center h-12 px-5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Allocation
          </button>
        </div>
      </div>
    </div>
  );
}
