'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Wrench,
  ShoppingCart,
  Receipt,
  Wallet,
  FileCheck,
  Calculator,
  Landmark,
  Menu,
  X,
} from 'lucide-react';
import { hasPermission, ProjectRole } from '@/lib/roles';

const navItems: {
  href: string;
  label: string;
  icon: React.ElementType;
  action: Parameters<typeof hasPermission>[1];
}[] = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, action: 'customerCreate' },
  { href: '/customers', label: 'Customers', icon: Users, action: 'customerCreate' },
  { href: '/quotations', label: 'Quotations', icon: FileText, action: 'salesQuotationCreate' },
  { href: '/job-orders', label: 'Job Orders', icon: Wrench, action: 'joChangeStatus' },
  { href: '/purchasing', label: 'Purchasing', icon: ShoppingCart, action: 'prCreate' },
  { href: '/expenses', label: 'Expenses', icon: Receipt, action: 'opexCreate' },
  { href: '/dcs', label: 'DCS', icon: Wallet, action: 'disburseRecordPayment' },
  { href: '/invoices', label: 'Invoices', icon: FileCheck, action: 'invoiceCreate' },
  { href: '/job-costing', label: 'Job Costing', icon: Calculator, action: 'viewJobCosting' },
  { href: '/accounting', label: 'Accounting', icon: Landmark, action: 'viewAccounting' },
];

export default function Navbar({ role }: { role: ProjectRole }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const visibleItems = navItems.filter((item) => hasPermission(role, item.action));

  return (
    <nav className="bg-slate-900 text-white" aria-label="Main Navigation">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:justify-start">
          <button
            type="button"
            className="lg:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded p-2 text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <ul className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-3 min-h-11 text-sm font-medium whitespace-nowrap border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset ${
                      isActive
                        ? 'border-brand-primary text-white font-semibold bg-slate-800/60'
                        : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <ul id="mobile-nav-menu" className="lg:hidden py-2 border-t border-slate-800 space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 min-h-11 text-sm font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                      isActive
                        ? 'bg-brand-primary text-white font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}
