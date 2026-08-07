import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/roles';

export default async function AccountingPage() {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session || !hasPermission(session.user.role, 'viewAccounting')) {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Accounting & Admin Export</h2>
        <p className="text-xs text-slate-500 mt-1">
          Admin-only area. QBO/CSV export scaffolds will be added in Phase 4.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Role Audit</h3>
        <div className="text-xs text-slate-600">
          Signed in as: <span className="font-semibold">{session.user.name}</span> (
          <span className="font-mono">{session.user.role}</span>)
        </div>
      </div>
    </div>
  );
}
