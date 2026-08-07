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
import { hasPermission, ProjectRole } from '@/lib/roles';

interface NavbarProps {
  role: ProjectRole | string | undefined;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: keyof typeof import('@/lib/roles').PERMISSIONS;
};

const navItems: NavItem[] = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/quotations', label: 'Quotations', icon: FileText, permission: 'salesQuotationCreate' },
  { href: '/job-orders', label: 'Job Orders', icon: Wrench },
  {
    href: '/job-costing/RA0003973',
    label: 'Job Costing',
    icon: DollarSign,
    permission: 'viewJobCosting',
  },
  { href: '/purchasing', label: 'Purchasing', icon: ShoppingCart, permission: 'prCreate' },
  { href: '/expenses', label: 'Expenses', icon: Receipt, permission: 'opexCreate' },
  { href: '/dcs', label: 'DCS', icon: Wallet, permission: 'disburseRecordPayment' },
  { href: '/invoices', label: 'Invoices', icon: FileText, permission: 'invoiceCreate' },
  { href: '/accounting', label: 'Accounting', icon: ShieldCheck, permission: 'viewAccounting' },
];

export default function Navbar({ role }: NavbarProps) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  const visibleItems = navItems.filter((item) =>
    item.permission ? hasPermission(role, item.permission) : true
  );

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-8">
        <div className="flex space-x-1 py-2.5 overflow-x-auto no-scrollbar">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d32f2f] ${
                  isActive
                    ? 'bg-[#d32f2f] text-white shadow-sm'
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
