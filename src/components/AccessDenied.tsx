'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { ROLES, ProjectRole } from '@/lib/roles';

interface AccessDeniedProps {
  role: ProjectRole;
  requiredCapability: string;
}

export default function AccessDenied({ role, requiredCapability }: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-rose-600" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-slate-600">
            The simulated role <strong>{ROLES[role]}</strong> does not have permission to view this
            module.
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2">
          <p className="text-sm">
            <span className="font-semibold text-slate-700">Active role:</span>{' '}
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-xs font-medium">
              {ROLES[role]}
            </span>
          </p>
          <p className="text-sm">
            <span className="font-semibold text-slate-700">Required capability:</span>{' '}
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
              {requiredCapability}
            </code>
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/lemans/demo')}
          className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-hover transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Overview
        </button>
      </div>
    </div>
  );
}
