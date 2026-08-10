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
  onQuickAddCustomer?: () => void;
  onQuickAddVehicle?: () => void;
}

export default function CascadingCustomerVehicleSelector({
  customers,
  vehicles,
  customerName = 'customerId',
  vehicleName = 'vehicleId',
  onQuickAddCustomer,
  onQuickAddVehicle,
}: CascadingCustomerVehicleSelectorProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const filteredVehicles = useMemo(
    () => vehicles.filter((v) => v.customerId === selectedCustomerId),
    [vehicles, selectedCustomerId]
  );

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedVehicleId('');
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
              className="inline-flex items-center text-xs font-semibold text-brand-primary hover:text-brand-hover"
            >
              <Plus className="h-3 w-3 mr-0.5" />
              Quick Add
            </button>
          )}
        </label>
        <select
          name={customerName}
          required
          value={selectedCustomerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base"
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
                className="inline-flex items-center text-xs font-semibold text-brand-primary hover:text-brand-hover"
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
          name={vehicleName}
          required
          disabled={!selectedCustomerId}
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base disabled:bg-slate-100 disabled:text-slate-400"
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
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
