'use client';

import { useRouter } from 'next/navigation';
import { ROLE_ORDER, ROLES, ProjectRole } from '@/lib/roles';

export default function RoleSwitcher({ currentRole }: { currentRole: ProjectRole }) {
  const router = useRouter();

  async function switchRole(role: ProjectRole) {
    await fetch('/api/set-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
      headers: { 'Content-Type': 'application/json' },
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500">Demo role:</span>
      <select
        value={currentRole}
        onChange={(e) => switchRole(e.target.value as ProjectRole)}
        className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
      >
        {ROLE_ORDER.map((role) => (
          <option key={role} value={role}>
            {ROLES[role]}
          </option>
        ))}
      </select>
    </div>
  );
}
