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
  const [isSwitching, setIsSwitching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const displayRole = optimisticRole ?? currentRole;

  async function switchRole(role: ProjectRole) {
    setError(null);
    setStatusMessage(null);
    setOptimisticRole(role);
    setIsSwitching(true);
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
      setStatusMessage(`Role switched to ${ROLES[role]}.`);
      router.refresh();
    } catch (err) {
      setOptimisticRole(null);
      setError(err instanceof Error ? err.message : ROLE_SWITCH_ERROR);
    } finally {
      setIsSwitching(false);
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1"
      aria-busy={isSwitching}
      aria-label="Demo role controls"
    >
      <label htmlFor="role-switcher" className="text-xs font-medium text-slate-600">
        Active role
      </label>
      <select
        id="role-switcher"
        value={displayRole}
        disabled={isSwitching}
        onChange={(e) => {
          const role = e.currentTarget.value as ProjectRole;
          const activeElement = document.activeElement;
          if (activeElement instanceof HTMLElement) activeElement.blur();
          e.currentTarget.blur();
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
          void switchRole(role);
        }}
        className="min-h-11 min-w-11 rounded-lg border border-slate-300 bg-white px-3 py-0 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:border-brand-primary disabled:cursor-wait disabled:opacity-70 focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        aria-describedby={error ? 'role-switcher-error' : undefined}
      >
        {ROLE_ORDER.map((role) => (
          <option key={role} value={role}>
            {ROLES[role]}
          </option>
        ))}
      </select>
      {isSwitching && (
        <span className="text-xs font-medium text-slate-500" role="status" aria-live="polite">
          Switching role…
        </span>
      )}
      {statusMessage && !isSwitching && (
        <span className="sr-only" role="status" aria-live="polite">
          {statusMessage}
        </span>
      )}
      {error && (
        <span id="role-switcher-error" role="alert" className="text-xs text-rose-600 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
