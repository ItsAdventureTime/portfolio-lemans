'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ROLE_ORDER, ROLES, ProjectRole } from '@/lib/roles';
import { getApiUrl } from '@/lib/api-url';

const ROLE_SWITCH_ERROR = "We couldn't switch roles. Please try again.";

export default function RoleSwitcher({ currentRole }: { currentRole: ProjectRole }) {
  const router = useRouter();
  const [optimisticRole, setOptimisticRole] = useState<ProjectRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const displayRole = optimisticRole ?? currentRole;

  async function switchRole(role: ProjectRole) {
    setError(null);
    setOptimisticRole(role);
    try {
      const res = await fetch(getApiUrl('/api/set-role'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ role }),
      });
      const data = (await res.json().catch(() => ({ error: ROLE_SWITCH_ERROR }))) as {
        error?: string;
        role?: string;
      };
      if (!res.ok || data.role !== role) {
        throw new Error(data.error || ROLE_SWITCH_ERROR);
      }
      router.refresh();
    } catch (err) {
      setOptimisticRole(null);
      setError(err instanceof Error ? err.message : ROLE_SWITCH_ERROR);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="role-switcher" className="text-xs font-medium text-slate-500">
        Demo role:
      </label>
      <select
        id="role-switcher"
        value={displayRole}
        onChange={(e) => switchRole(e.target.value as ProjectRole)}
        className="text-sm border border-slate-300 rounded px-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary min-h-11 min-w-11 py-0"
        aria-describedby={error ? 'role-switcher-error' : undefined}
      >
        {ROLE_ORDER.map((role) => (
          <option key={role} value={role}>
            {ROLES[role]}
          </option>
        ))}
      </select>
      {error && (
        <span id="role-switcher-error" role="alert" className="text-xs text-rose-600 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
