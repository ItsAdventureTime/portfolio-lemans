'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const visibleItems = navItems.filter((item) => hasPermission(role, item.action));

  return (
    <nav className="bg-slate-900 text-white">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center gap-1 overflow-x-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-3 min-h-11 text-sm font-medium whitespace-nowrap border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset ${
                    isActive
                      ? 'border-brand-primary text-white'
                      : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
