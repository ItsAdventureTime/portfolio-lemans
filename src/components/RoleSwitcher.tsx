'use client';

import { useEffect, useState } from 'react';
import { ROLE_ORDER, ROLES, ProjectRole } from '@/lib/roles';
import { getApiUrl } from '@/lib/api-url';

export default function RoleSwitcher({ currentRole }: { currentRole: ProjectRole }) {
  const [displayRole, setDisplayRole] = useState<ProjectRole>(currentRole);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayRole(currentRole);
  }, [currentRole]);

  async function switchRole(role: ProjectRole) {
    setError(null);
    setDisplayRole(role);
    try {
      const res = await fetch(getApiUrl('/api/set-role'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({ error: 'Role switch failed' }));
      if (!res.ok) {
        throw new Error(data.error || 'Role switch failed');
      }
    } catch (err) {
      setDisplayRole(currentRole);
      setError(err instanceof Error ? err.message : 'Role switch failed');
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
