import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { ROLES, ProjectRole } from '@/lib/roles';

interface AccessDeniedProps {
  role?: ProjectRole | string | undefined;
  requiredRole?: string;
}

export default function AccessDenied({ role, requiredRole = 'ROLE-ADMIN' }: AccessDeniedProps) {
  const roleDisplay = role ? ROLES[role as ProjectRole] || role : 'Unknown';

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-[#d32f2f]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-base text-slate-600">
            This module requires{' '}
            <span className="font-semibold text-slate-900">{requiredRole}</span> privileges.
          </p>
          <p className="text-sm text-slate-500">
            You are currently signed in as{' '}
            <span className="font-semibold text-slate-700">{roleDisplay}</span>.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-[#d32f2f] text-white text-sm font-semibold hover:bg-[#b71c1c] transition-colors shadow-sm whitespace-nowrap"
        >
          Return to Overview
        </Link>
      </div>
    </div>
  );
}
