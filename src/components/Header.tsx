'use client';

import React from 'react';
import { Search, Shield, Bell, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Shield Logo */}
        <div className="flex items-center space-x-3">
          <div className="bg-brand-primary text-white p-2 rounded-xl flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            LSP
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Le Mans Service Plus
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Operations & Job Cost Management
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search Job Order #, Customer, Vehicle Plate..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Action Controls & Profile Pill */}
        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            LOCAL-DEMO (PODMAN)
          </span>

          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
              AD
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-none">Admin User</p>
              <p className="text-[10px] text-slate-500 leading-tight">ROLE-ADMIN</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
