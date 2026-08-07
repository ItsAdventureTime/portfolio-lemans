import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/roles';
import AccessDenied from '@/components/AccessDenied';

export default async function AccountingPage() {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session || !hasPermission(session.user.role, 'viewAccounting')) {
    return <AccessDenied role={session?.user.role} requiredRole="ROLE-ADMIN" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Accounting &amp; Admin Export</h2>
        <p className="text-sm text-slate-500 mt-1">
          Admin-only area. QBO/CSV export scaffolds will be added in Phase 4.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Role Audit</h3>
        <div className="text-base text-slate-600">
          Signed in as: <span className="font-semibold">{session.user.name}</span> (
          <span className="font-mono">{session.user.role}</span>)
        </div>
      </div>
    </div>
  );
}
