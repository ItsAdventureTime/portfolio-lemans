'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0
  );
}

export interface CustomerOption {
  id: string;
  customerNo: string;
  name: string;
}

export interface VehicleOption {
  id: string;
  customerId: string;
  plateNo: string;
  makeModel: string;
}

interface CascadingCustomerVehicleSelectorProps {
  customers: CustomerOption[];
  vehicles: VehicleOption[];
  customerName?: string;
  vehicleName?: string;
  selectedCustomerId?: string;
  selectedVehicleId?: string;
  onChange?: (customerId: string, vehicleId: string) => void;
  onQuickAddCustomer?: () => void;
  onQuickAddVehicle?: () => void;
}

export default function CascadingCustomerVehicleSelector({
  customers,
  vehicles,
  customerName = 'customerId',
  vehicleName = 'vehicleId',
  selectedCustomerId: controlledCustomerId,
  selectedVehicleId: controlledVehicleId,
  onChange,
  onQuickAddCustomer,
  onQuickAddVehicle,
}: CascadingCustomerVehicleSelectorProps) {
  const isControlled = controlledCustomerId !== undefined;
  const [internalCustomerId, setInternalCustomerId] = useState<string>('');
  const [internalVehicleId, setInternalVehicleId] = useState<string>('');

  const selectedCustomerId = isControlled ? controlledCustomerId : internalCustomerId;
  const selectedVehicleId = isControlled ? (controlledVehicleId ?? '') : internalVehicleId;

  const filteredVehicles = useMemo(
    () => vehicles.filter((v) => v.customerId === selectedCustomerId),
    [vehicles, selectedCustomerId]
  );

  const handleCustomerChange = (customerId: string) => {
    if (isControlled) {
      onChange?.(customerId, '');
    } else {
      setInternalCustomerId(customerId);
      setInternalVehicleId('');
    }
  };

  const handleVehicleChange = (vehicleId: string) => {
    if (isControlled) {
      onChange?.(selectedCustomerId, vehicleId);
    } else {
      setInternalVehicleId(vehicleId);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
          <span>Customer</span>
          {onQuickAddCustomer && (
            <button
              type="button"
              onClick={onQuickAddCustomer}
              className="inline-flex items-center justify-center min-h-11 min-w-11 text-xs font-semibold text-brand-primary hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded px-2"
            >
              <Plus className="h-3 w-3 mr-0.5" />
              Quick Add
            </button>
          )}
        </label>
        <select
          id={customerName}
          name={customerName}
          required
          value={selectedCustomerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
          aria-controls={`${vehicleName}-select`}
          className="min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-brand-primary"
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.customerNo} - {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
          <span>Vehicle</span>
          {selectedCustomerId ? (
            onQuickAddVehicle && (
              <button
                type="button"
                onClick={onQuickAddVehicle}
                className="inline-flex items-center justify-center min-h-11 min-w-11 text-xs font-semibold text-brand-primary hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded px-2"
              >
                <Plus className="h-3 w-3 mr-0.5" />
                Quick Add
              </button>
            )
          ) : (
            <span className="text-xs text-slate-400">Select Customer First</span>
          )}
        </label>
        <select
          id={`${vehicleName}-select`}
          name={vehicleName}
          required
          disabled={!selectedCustomerId}
          value={selectedVehicleId}
          onChange={(e) => handleVehicleChange(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-base disabled:bg-slate-100 disabled:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-brand-primary"
        >
          <option value="">
            {selectedCustomerId ? 'Select Vehicle' : 'Select Customer First'}
          </option>
          {filteredVehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plateNo} - {v.makeModel}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface QuickAddModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function QuickAddModal({ title, open, onClose, children }: QuickAddModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const firstFocusable = getFocusableElements(dialog)[0];
    (firstFocusable ?? dialog).focus({ preventScroll: true });

    return () => {
      const trigger = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = getFocusableElements(dialog);
    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement;
    const focusIsInsideDialog = activeElement instanceof Node && dialog.contains(activeElement);

    if (
      (event.shiftKey &&
        (activeElement === first || activeElement === dialog || !focusIsInsideDialog)) ||
      (!event.shiftKey &&
        (activeElement === last || activeElement === dialog || !focusIsInsideDialog))
    ) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus({ preventScroll: true });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between">
          <h3 id={titleId} className="text-lg font-bold text-slate-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            aria-label="Close quick add dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
