'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-url';
import { Landmark } from 'lucide-react';

const DEMO_ENTRY_ERROR = "We couldn't open the demo. Please try again.";

export default function DemoSplash() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enter() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(getApiUrl('/api/enter-demo'), {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        throw new Error(DEMO_ENTRY_ERROR);
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : DEMO_ENTRY_ERROR);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-12 max-w-lg w-full space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center text-white">
            <Landmark className="w-8 h-8" aria-hidden="true" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Le Mans Operations</h1>
          <p className="text-slate-600">Job Cost Management System — interactive demo</p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-left text-sm text-amber-800">
          <p className="font-semibold mb-1">Demo environment</p>
          <p>
            This is a fictional walkthrough environment. There are no passwords, no accounts, and no
            real authentication. Entering starts a simulated Admin actor.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-rose-600 font-medium">
            {error}
          </p>
        )}
        <button
          onClick={enter}
          disabled={busy}
          className="w-full inline-flex items-center justify-center h-12 px-6 rounded-xl bg-brand-primary text-white text-base font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 min-h-11"
        >
          {busy ? 'Entering demo…' : 'Enter as an Admin'}
        </button>
      </div>
    </div>
  );
}
