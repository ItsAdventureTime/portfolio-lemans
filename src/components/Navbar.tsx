'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Wrench,
  DollarSign,
  ShoppingCart,
  Receipt,
  Wallet,
  ShieldCheck,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/quotations', label: 'Quotations', icon: FileText },
    { href: '/job-orders', label: 'Job Orders', icon: Wrench },
    { href: '/job-costing/RA0003973', label: 'Job Costing', icon: DollarSign },
    { href: '/purchasing', label: 'Purchasing', icon: ShoppingCart },
    { href: '/expenses', label: 'Expenses', icon: Receipt },
    { href: '/dcs', label: 'DCS', icon: Wallet },
    { href: '/invoices', label: 'Invoices', icon: FileText },
    { href: '/accounting', label: 'Accounting', icon: ShieldCheck },
  ];

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 py-2.5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
