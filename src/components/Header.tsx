import { getDemoRole } from '@/lib/actor';
import { getBasePath } from '@/lib/base-path';
import Image from 'next/image';
import RoleSwitcher from './RoleSwitcher';

export default async function Header() {
  const role = await getDemoRole();
  const logoSrc = `${getBasePath()}/lemans-service-plus-logo.jpg`;

  return (
    <header className="app-header relative z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="h-1 bg-brand-primary" aria-hidden="true" />
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3.5">
          <Image
            src={logoSrc}
            alt="Le Mans Service Plus OPC logo"
            width={48}
            height={48}
            sizes="48px"
            unoptimized
            className="h-12 w-12 shrink-0 rounded-xl object-contain shadow-sm ring-1 ring-slate-200"
            priority
          />
          <div className="brand-lockup min-w-0">
            <p className="utility-label text-brand-primary">Service center cockpit</p>
            <p className="truncate text-lg font-extrabold text-slate-950">Le Mans Service Plus</p>
            <p className="truncate text-xs font-medium text-slate-500">Operations workspace</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4">
          <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-brand-primary/20 bg-brand-light px-3 py-1.5 text-xs font-bold text-brand-primary">
            <span
              className="h-2 w-2 rounded-full bg-brand-primary shadow-[0_0_0_3px_rgba(211,47,47,0.12)]"
              aria-hidden="true"
            />
            Demo mode
          </span>
          <div className="sm:border-l sm:border-slate-200 sm:pl-4" aria-label="Current demo role">
            <RoleSwitcher currentRole={role} />
          </div>
        </div>
      </div>
    </header>
  );
}
