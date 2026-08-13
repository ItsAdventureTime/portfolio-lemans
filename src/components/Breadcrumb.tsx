'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { stripBasePath } from '@/lib/base-path';

const routeLabels: Record<string, string> = {
  customers: 'Customers',
  quotations: 'Quotations',
  'job-orders': 'Job Orders',
  purchasing: 'Purchasing',
  expenses: 'Expenses',
  dcs: 'Disbursement Control',
  invoices: 'Invoices',
  'job-costing': 'Job Costing',
  accounting: 'Accounting',
};

export default function Breadcrumb() {
  const pathname = usePathname();
  if (!pathname || pathname === '/') return null;

  const segments = stripBasePath(pathname).split('/').filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-slate-200 bg-white/65 px-4 py-2 text-xs font-medium text-slate-600 backdrop-blur sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center gap-1.5">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 py-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <Home className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Overview</span>
        </Link>

        {segments.map((segment, index) => {
          const currentPath = '/' + segments.slice(0, index + 1).join('/');
          const isLast = index === segments.length - 1;
          const label = routeLabels[segment] || segment.toUpperCase();

          return (
            <div key={currentPath} className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-slate-400" aria-hidden="true" />
              {isLast ? (
                <span className="font-semibold text-slate-900 px-1 py-0.5" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link
                  href={currentPath}
                  className="inline-flex min-h-11 items-center rounded-md px-2 py-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  {label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
