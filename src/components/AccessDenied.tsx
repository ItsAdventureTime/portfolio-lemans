'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { ROLES, ProjectRole } from '@/lib/roles';
import { getBasePath } from '@/lib/base-path';
import Image from 'next/image';

const LOGO_SRC = `${getBasePath()}/lemans-service-plus-logo.jpg`;

interface AccessDeniedProps {
  role: ProjectRole;
  requiredCapability: string;
}

export default function AccessDenied({ role, requiredCapability }: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <section className="recovery-shell surface-card w-full max-w-md space-y-5 p-6 text-center sm:p-8">
        <Image
          src={LOGO_SRC}
          alt="Le Mans Service Plus OPC logo"
          width={56}
          height={56}
          sizes="56px"
          unoptimized
          className="recovery-mark mx-auto h-14 w-14 object-contain"
        />
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50"
          aria-hidden="true"
        >
          <ShieldAlert className="h-6 w-6 text-rose-600" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="utility-label text-brand-primary">Le Mans operations</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Access restricted</h1>
          <p className="text-sm leading-6 text-slate-600">
            The simulated <span className="font-medium">{ROLES[role]}</span> role does not have
            access to this module.
          </p>
        </div>
        <div className="surface-card-muted space-y-2 p-4 text-left">
          <p className="text-sm">
            <span className="font-medium text-slate-700">Active role:</span>{' '}
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-xs font-medium">
              {ROLES[role]}
            </span>
          </p>
          <p className="text-sm">
            <span className="font-medium text-slate-700">Required capability:</span>{' '}
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
