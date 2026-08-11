'use client';

import React, { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';

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
        <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
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
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
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
        <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
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
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-11 w-11 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
