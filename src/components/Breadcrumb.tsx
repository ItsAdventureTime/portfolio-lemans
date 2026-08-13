'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

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

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-slate-50 border-b border-slate-200 py-2.5 px-4 text-xs font-medium text-slate-600"
    >
      <div className="w-full max-w-screen-2xl mx-auto flex items-center flex-wrap gap-1.5">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded px-1 py-0.5"
        >
          <Home className="w-3.5 h-3.5" />
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
                  className="text-slate-500 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded px-1 py-0.5"
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
