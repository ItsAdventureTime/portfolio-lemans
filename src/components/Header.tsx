import { getDemoRole } from '@/lib/actor';
import Image from 'next/image';
import RoleSwitcher from './RoleSwitcher';

export default async function Header() {
  const role = await getDemoRole();

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/lemans-service-plus-logo.jpg"
            alt="LeMans Service Plus OPC logo"
            width={48}
            height={48}
            sizes="48px"
            className="h-10 w-10 rounded object-contain"
            priority
          />
          <div>
            <h1 className="text-sm font-semibold text-slate-900">Le Mans Operations</h1>
            <p className="text-xs text-slate-500">Job Cost Management System</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4">
          <span className="text-xs bg-brand-light text-brand-primary px-2 py-1 rounded font-medium">
            Demo mode
          </span>
          <RoleSwitcher currentRole={role} />
        </div>
      </div>
    </header>
  );
}
