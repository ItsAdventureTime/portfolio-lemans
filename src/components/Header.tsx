import { getDemoRole } from '@/lib/actor';
import RoleSwitcher from './RoleSwitcher';

export default async function Header() {
  const role = await getDemoRole();

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-8 xl:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-brand-primary flex items-center justify-center text-white font-bold">
            LM
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900">Le Mans Operations</h1>
            <p className="text-xs text-slate-500">Job Cost Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-brand-light text-brand-primary px-2 py-1 rounded font-medium">
            Demo mode
          </span>
          <RoleSwitcher currentRole={role} />
        </div>
      </div>
    </header>
  );
}
