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
import { canAccessModule, ProjectRole, WorkspaceModule } from '@/lib/roles';
import { stripBasePath } from '@/lib/base-path';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  module?: WorkspaceModule;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      {
        href: '/',
        label: 'Overview',
        icon: LayoutDashboard,
      },
      {
        href: '/customers',
        label: 'Customers',
        icon: Users,
        module: 'customers',
      },
      {
        href: '/quotations',
        label: 'Quotations',
        icon: FileText,
        module: 'quotations',
      },
      {
        href: '/job-orders',
        label: 'Job Orders',
        icon: Wrench,
        module: 'jobOrders',
      },
    ],
  },
  {
    label: 'Control',
    items: [
      {
        href: '/purchasing',
        label: 'Purchasing',
        icon: ShoppingCart,
        module: 'purchasing',
      },
      {
        href: '/expenses',
        label: 'Expenses',
        icon: Receipt,
        module: 'expenses',
      },
      {
        href: '/dcs',
        label: 'DCS',
        icon: Wallet,
        module: 'dcs',
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        href: '/invoices',
        label: 'Invoices',
        icon: FileCheck,
        module: 'invoices',
      },
      {
        href: '/job-costing',
        label: 'Job Costing',
        icon: Calculator,
        module: 'jobCosting',
      },
      {
        href: '/accounting',
        label: 'Accounting',
        icon: Landmark,
        module: 'accounting',
      },
    ],
  },
];

export default function Navbar({ role }: { role: ProjectRole }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentPath = stripBasePath(pathname ?? '/');

  function isActive(item: NavItem) {
    return item.href === '/'
      ? currentPath === '/'
      : currentPath === item.href || currentPath.startsWith(`${item.href}/`);
  }

  function canSeeItem(item: NavItem) {
    // Overview is the shared landing surface for every simulated role. The
    // module policy still filters the role-specific workspaces.
    return item.href === '/' || (item.module ? canAccessModule(role, item.module) : false);
  }

  return (
    <nav
      className="nav-rail border-b border-charcoal-line text-white"
      aria-label="Primary navigation"
    >
      <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:justify-start">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-slate-300 transition-colors hover:bg-charcoal-soft hover:text-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal lg:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            <span className="sr-only">Primary navigation</span>
          </button>

          <div className="hidden items-center gap-3 overflow-x-auto overflow-y-hidden lg:flex">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter(canSeeItem);
              if (visibleItems.length === 0) return null;

              return (
                <ul
                  key={group.label}
                  className="nav-group flex items-center gap-1"
                  aria-label={group.label}
                >
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          prefetch={true}
                          className={`nav-link group flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-[background-color,color,border-color,transform] active:translate-y-px ${
                            active
                              ? 'border-brand-primary bg-charcoal-soft text-white'
                              : 'border-transparent text-slate-300 hover:bg-charcoal-soft hover:text-white'
                          }`}
                          aria-current={active ? 'page' : undefined}
                        >
                          <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              );
            })}
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="space-y-3 border-t border-charcoal-line py-3 lg:hidden"
            aria-label="Mobile navigation menu"
          >
            {navGroups.map((group) => {
              const visibleItems = group.items.filter(canSeeItem);
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.label} role="group" aria-label={group.label}>
                  <p className="utility-label px-3 pb-1 text-slate-400">{group.label}</p>
                  <ul className="space-y-1">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            prefetch={true}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`nav-link flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-[background-color,color,transform] active:translate-y-px ${
                              active
                                ? 'bg-brand-primary text-white'
                                : 'text-slate-300 hover:bg-charcoal-soft hover:text-white'
                            }`}
                            aria-current={active ? 'page' : undefined}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
