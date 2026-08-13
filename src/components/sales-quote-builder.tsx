'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { centsToPeso, formatPeso, parsePesoToCents } from '@/lib/money';

export type QuoteItemType = 'LABOR' | 'PARTS' | 'MISC';

export interface QuoteItem {
  id: string;
  itemType: QuoteItemType;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
}

export interface SalesQuoteBuilderValue {
  totalLaborCents: number;
  totalPartsCents: number;
  totalMiscCents: number;
  totalDiscountsCents: number;
  grandTotalCents: number;
  items: QuoteItem[];
}

interface SalesQuoteBuilderProps {
  name?: string;
  initialItems?: QuoteItem[];
  onChange?: (value: SalesQuoteBuilderValue) => void;
}

const itemTypeOptions: { value: QuoteItemType; label: string }[] = [
  { value: 'LABOR', label: 'Labor' },
  { value: 'PARTS', label: 'Parts' },
  { value: 'MISC', label: 'Misc' },
];

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function SalesQuoteBuilder({
  name = 'items',
  initialItems = [],
  onChange,
}: SalesQuoteBuilderProps) {
  const [items, setItems] = useState<QuoteItem[]>(
    initialItems.length > 0
      ? initialItems
      : [
          {
            id: createId(),
            itemType: 'LABOR',
            description: '',
            quantity: 1,
            unitPriceCents: 0,
            discountCents: 0,
          },
        ]
  );

  const updateItems = useCallback(
    (nextItems: QuoteItem[]) => {
      setItems(nextItems);
      const totalLaborCents = nextItems
        .filter((i) => i.itemType === 'LABOR')
        .reduce((sum, i) => sum + Math.round(i.quantity * i.unitPriceCents) - i.discountCents, 0);
      const totalPartsCents = nextItems
        .filter((i) => i.itemType === 'PARTS')
        .reduce((sum, i) => sum + Math.round(i.quantity * i.unitPriceCents) - i.discountCents, 0);
      const totalMiscCents = nextItems
        .filter((i) => i.itemType === 'MISC')
        .reduce((sum, i) => sum + Math.round(i.quantity * i.unitPriceCents) - i.discountCents, 0);
      const totalDiscountsCents = nextItems.reduce((sum, i) => sum + i.discountCents, 0);
      const grandTotalCents = totalLaborCents + totalPartsCents + totalMiscCents;
      onChange?.({
        totalLaborCents,
        totalPartsCents,
        totalMiscCents,
        totalDiscountsCents,
        grandTotalCents,
        items: nextItems,
      });
    },
    [onChange]
  );

  const addRow = useCallback(
    (type: QuoteItemType) => {
      updateItems([
        ...items,
        {
          id: createId(),
          itemType: type,
          description: '',
          quantity: 1,
          unitPriceCents: 0,
          discountCents: 0,
        },
      ]);
    },
    [items, updateItems]
  );

  const removeRow = useCallback(
    (id: string) => {
      updateItems(items.filter((i) => i.id !== id));
    },
    [items, updateItems]
  );

  const updateRow = useCallback(
    (id: string, patch: Partial<QuoteItem>) => {
      updateItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    },
    [items, updateItems]
  );

  const summary = useMemo(() => {
    const totalLaborCents = items
      .filter((i) => i.itemType === 'LABOR')
      .reduce((sum, i) => sum + Math.round(i.quantity * i.unitPriceCents) - i.discountCents, 0);
    const totalPartsCents = items
      .filter((i) => i.itemType === 'PARTS')
      .reduce((sum, i) => sum + Math.round(i.quantity * i.unitPriceCents) - i.discountCents, 0);
    const totalMiscCents = items
      .filter((i) => i.itemType === 'MISC')
      .reduce((sum, i) => sum + Math.round(i.quantity * i.unitPriceCents) - i.discountCents, 0);
    const totalDiscountsCents = items.reduce((sum, i) => sum + i.discountCents, 0);
    const grandTotalCents = totalLaborCents + totalPartsCents + totalMiscCents;
    return {
      totalLaborCents,
      totalPartsCents,
      totalMiscCents,
      totalDiscountsCents,
      grandTotalCents,
    };
  }, [items]);

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-base">
          <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right">
                Qty
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right">
                Unit Price
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right">
                Disc
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right">
                Net
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {items.map((item) => {
              const net = Math.round(item.quantity * item.unitPriceCents) - item.discountCents;
              return (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-3">
                    <select
                      value={item.itemType}
                      onChange={(e) =>
                        updateRow(item.id, { itemType: e.target.value as QuoteItemType })
                      }
                      className="min-h-11 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                    >
                      {itemTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 min-w-[200px]">
                    <input
                      value={item.description}
                      onChange={(e) => updateRow(item.id, { description: e.target.value })}
                      placeholder="Item description"
                      className="min-h-11 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateRow(item.id, { quantity: Number(e.target.value) })}
                      className="min-h-11 w-20 rounded-lg border border-slate-300 px-2 py-2 text-right text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
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
                        value={centsToPeso(item.unitPriceCents)}
                        onChange={(e) =>
                          updateRow(item.id, {
                            unitPriceCents: parsePesoToCents(e.target.value) ?? 0,
                          })
                        }
                        className="min-h-11 w-28 rounded-lg border border-slate-300 py-2 pl-6 pr-2 text-right text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                      />
                    </div>
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
                        value={centsToPeso(item.discountCents)}
                        onChange={(e) =>
                          updateRow(item.id, {
                            discountCents: parsePesoToCents(e.target.value) ?? 0,
                          })
                        }
                        className="min-h-11 w-24 rounded-lg border border-slate-300 py-2 pl-6 pr-2 text-right text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                    {formatPeso(net)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(item.id)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => addRow('LABOR')}
          className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Labor Row
        </button>
        <button
          type="button"
          onClick={() => addRow('PARTS')}
          className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Parts Row
        </button>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Labor Subtotal</span>
          <span className="font-mono font-semibold">{formatPeso(summary.totalLaborCents)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Parts Subtotal</span>
          <span className="font-mono font-semibold">{formatPeso(summary.totalPartsCents)}</span>
        </div>
        {summary.totalMiscCents > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Misc Subtotal</span>
            <span className="font-mono font-semibold">{formatPeso(summary.totalMiscCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Total Discounts</span>
          <span className="font-mono font-semibold text-rose-600">
            -{formatPeso(summary.totalDiscountsCents)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
          <span className="text-base font-bold text-slate-900">Quote Grand Total</span>
          <span className="text-lg font-bold font-mono text-brand-primary">
            {formatPeso(summary.grandTotalCents)}
          </span>
        </div>
      </div>
    </div>
  );
}
