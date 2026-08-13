import { getDemoRole } from '@/lib/actor';
import { getBasePath } from '@/lib/base-path';
import Image from 'next/image';
import RoleSwitcher from './RoleSwitcher';

export default async function Header() {
  const role = await getDemoRole();
  const logoSrc = `${getBasePath()}/lemans-service-plus-logo.jpg`;

  return (
    <header className="relative z-30 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="h-1 bg-brand-primary" aria-hidden="true" />
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3.5">
          <Image
            src={logoSrc}
            alt="LeMans Service Plus OPC logo"
            width={48}
            height={48}
            sizes="48px"
            unoptimized
            className="h-11 w-11 rounded-lg object-contain shadow-sm ring-1 ring-slate-200"
            priority
          />
          <div className="min-w-0">
            <p className="utility-label">Service center cockpit</p>
            <h1 className="truncate text-base font-bold tracking-tight text-slate-900">
              LeMans Operations
            </h1>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4">
          <span className="inline-flex min-h-8 items-center gap-2 rounded-md border border-brand-primary/20 bg-brand-light px-2.5 py-1 text-xs font-bold text-brand-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" aria-hidden="true" />
            Demo mode
          </span>
          <div className="sm:border-l sm:border-slate-200 sm:pl-4">
            <RoleSwitcher currentRole={role} />
          </div>
        </div>
      </div>
    </header>
  );
}
