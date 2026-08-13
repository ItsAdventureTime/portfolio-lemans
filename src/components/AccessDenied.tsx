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
      <section className="surface-card w-full max-w-md space-y-5 p-6 text-center sm:p-8">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50"
          aria-hidden="true"
        >
          <ShieldAlert className="w-7 h-7 text-rose-600" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Access restricted</h1>
          <p className="text-slate-600">
            The simulated <strong>{ROLES[role]}</strong> role does not have access to this module.
          </p>
        </div>
        <div className="surface-card-muted space-y-2 p-4 text-left">
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
        <button type="button" onClick={() => router.push('/')} className="action-secondary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Return to overview
        </button>
      </section>
    </div>
  );
}
