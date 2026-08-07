import React from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Search, Shield, Bell, User, LogOut } from 'lucide-react';
import { auth } from '@/lib/auth';
import { ROLES } from '@/lib/roles';
import LogoutButton from './LogoutButton';

export default async function Header() {
  const session = await auth.api.getSession({ headers: headers() });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-brand-primary text-white p-2 rounded-xl flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            LSP
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Le Mans Service Plus
            </h1>
            <p className="text-xs text-slate-500 font-medium">Operations & Job Cost Management</p>
          </div>
        </div>

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

          {session?.user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
                {session.user.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('') || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-none">{session.user.name}</p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {ROLES[(session.user.role as keyof typeof ROLES) || 'ROLE_SALES']}
                </p>
              </div>
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
