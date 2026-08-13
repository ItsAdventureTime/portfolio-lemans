'use client';

import React, { useState, useMemo } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { centsToPeso, formatPeso, parsePesoToCents } from '@/lib/money';

export interface JobOrderOption {
  id: string;
  joNo: string;
  customerName: string;
  makeModel: string;
}

export interface AllocationLine {
  joId: string;
  amountCents: number;
  description: string;
}

interface MultiJoAllocationModalProps {
  open: boolean;
  onClose: () => void;
  invoiceAmountCents: number;
  jobOrders: JobOrderOption[];
  initialAllocations?: AllocationLine[];
  onSave: (allocations: AllocationLine[]) => void;
}

export default function MultiJoAllocationModal({
  open,
  onClose,
  invoiceAmountCents,
  jobOrders,
  initialAllocations = [],
  onSave,
}: MultiJoAllocationModalProps) {
  const [lines, setLines] = useState<AllocationLine[]>(
    initialAllocations.length > 0
      ? initialAllocations
      : [{ joId: '', amountCents: 0, description: '' }]
  );

  const addLine = () =>
    setLines((prev) => [...prev, { joId: '', amountCents: 0, description: '' }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, patch: Partial<AllocationLine>) =>
    setLines((prev) => prev.map((line, i) => (i === idx ? { ...line, ...patch } : line)));

  const allocatedTotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.amountCents, 0),
    [lines]
  );
  const remainingCents = invoiceAmountCents - allocatedTotal;
  const isBalanced = remainingCents === 0;
  const isOverAllocated = remainingCents < 0;

  const handleSave = () => {
    if (isOverAllocated) return;
    const valid = lines.filter((l) => l.joId && l.amountCents > 0);
    onSave(valid);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="allocation-modal-title"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 id="allocation-modal-title" className="text-lg font-bold text-slate-900">
              Allocate Supplier Invoice Across Job Orders
            </h3>
            <p className="text-sm text-slate-500">
              Total invoice:{' '}
              <span className="font-mono font-semibold">{formatPeso(invoiceAmountCents)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
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
                      aria-label={`Job order for allocation ${idx + 1}`}
                      className="min-h-11 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
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
                      aria-label={`Description for allocation ${idx + 1}`}
                      className="min-h-11 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
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
                        value={centsToPeso(line.amountCents)}
                        onChange={(e) =>
                          updateLine(idx, {
                            amountCents: parsePesoToCents(e.target.value) ?? 0,
                          })
                        }
                        aria-label={`Amount for allocation ${idx + 1}`}
                        className="min-h-11 w-28 rounded-lg border border-slate-300 py-2 pl-6 pr-2 text-right text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      disabled={lines.length === 1}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-30"
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
          className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          + Add Allocation Line
        </button>

        <div
          className={`flex items-center justify-between rounded-xl border p-3 ${
            isBalanced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : isOverAllocated
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center space-x-2">
            {isBalanced ? (
              <>
                <CheckCircle className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                <span className="font-semibold">Fully allocated</span>
              </>
            ) : isOverAllocated ? (
              <>
                <AlertCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />
                <span className="font-semibold">
                  Over-allocated by {formatPeso(Math.abs(remainingCents))}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                <span className="font-semibold">
                  Remaining to allocate: {formatPeso(remainingCents)}
                </span>
              </>
            )}
          </div>
          <div className="font-mono font-bold">
            {formatPeso(allocatedTotal)} / {formatPeso(invoiceAmountCents)}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isBalanced}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Allocation
          </button>
        </div>
      </div>
    </div>
  );
}
