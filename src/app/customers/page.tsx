'use client';

import React, { useState } from 'react';
import { Users, Car, Plus, Search, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function CustomersPage() {
  const [uiState, setUiState] = useState<'loading' | 'empty' | 'error' | 'success'>('success');

  // Authentic reference customer data
  const sampleCustomer = {
    customerNo: '006500',
    name: 'ACCUSTANDARD MEDICAL AND DIAGNOSTIC CORP.',
    tin: '008-123-456-000',
    address: 'EL DECARO BLDG. B2L2 ST. JUDE SUB. SAN AGUSTIN CITY OF SAN FERNANDO PAMPANGA',
    phone: '0917-136-6569',
    email: 'contact@accustandard.ph',
    vehicles: [
      {
        plateNo: 'CBE7864',
        makeModel: '2023 TOYOTA LITEACE',
        color: 'WHITE',
        vinChassis: 'MHKB3FE10NK001080',
        engineNo: '2NRG909564',
        odometer: '125,000 KM',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header & State Control Switcher for Verification */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="h-5 w-5 text-slate-700" />
            <span>Customer & Vehicle Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain customer records and linked vehicle service profiles.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setUiState('success')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              uiState === 'success' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Hydrated
          </button>
          <button
            onClick={() => setUiState('loading')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              uiState === 'loading' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Loading
          </button>
          <button
            onClick={() => setUiState('empty')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              uiState === 'empty' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Empty
          </button>
          <button
            onClick={() => setUiState('error')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              uiState === 'error' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Error
          </button>
        </div>
      </div>

      {/* STATE 1: LOADING SKELETON */}
      {uiState === 'loading' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-32 bg-slate-100 rounded-xl w-full"></div>
        </div>
      )}

      {/* STATE 2: EMPTY STATE */}
      {uiState === 'empty' && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Customers Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are currently no customer or vehicle records. Register a new customer to start issuing quotations.
            </p>
          </div>
          <button className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-semibold hover:bg-brand-hover transition-colors inline-flex items-center space-x-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Register First Customer</span>
          </button>
        </div>
      )}

      {/* STATE 3: ERROR BOUNDARY STATE */}
      {uiState === 'error' && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-brand-primary mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">Failed to Load Customer Directory</h3>
          <p className="text-xs text-rose-700">
            Database connection timeout occurred while querying customer records.
          </p>
          <button
            onClick={() => setUiState('success')}
            className="px-3.5 py-2 bg-brand-primary text-white rounded-xl text-xs font-semibold hover:bg-brand-hover inline-flex items-center space-x-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* STATE 4: SUCCESS HYDRATED STATE */}
      {uiState === 'success' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white">
                    #{sampleCustomer.customerNo}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{sampleCustomer.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">{sampleCustomer.address}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200">
                  Edit Profile
                </button>
                <button className="px-3 py-1.5 bg-brand-primary text-white rounded-xl text-xs font-semibold hover:bg-brand-hover">
                  + Add Vehicle
                </button>
              </div>
            </div>

            {/* Vehicle List */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Registered Vehicles (1)
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold">
                    <Car className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900">
                        {sampleCustomer.vehicles[0].makeModel}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-900 text-white rounded">
                        {sampleCustomer.vehicles[0].plateNo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      VIN: {sampleCustomer.vehicles[0].vinChassis} • Engine: {sampleCustomer.vehicles[0].engineNo}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">
                    Odometer: {sampleCustomer.vehicles[0].odometer}
                  </span>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                    Active Repair Order: RA0003973
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
