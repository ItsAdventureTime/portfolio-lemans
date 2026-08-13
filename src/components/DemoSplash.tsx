'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-url';
import { getBasePath } from '@/lib/base-path';
import Image from 'next/image';
import { Activity, ArrowRight, CircleCheck } from 'lucide-react';

const DEMO_ENTRY_ERROR = "We couldn't open the demo. Please try again.";
const LOGO_SRC = `${getBasePath()}/lemans-service-plus-logo.jpg`;

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
    <section
      className="relative isolate flex min-h-[calc(100dvh-15rem)] items-center overflow-hidden py-8 sm:py-12"
      aria-labelledby="demo-splash-heading"
    >
      <div className="pointer-events-none absolute -right-24 top-8 -z-10 h-64 w-64 rounded-full bg-brand-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-slate-300/30 blur-3xl" />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div className="max-w-2xl">
          <div className="mb-7 flex items-center gap-4">
            <Image
              src={LOGO_SRC}
              alt="LeMans Service Plus OPC logo"
              width={144}
              height={144}
              sizes="144px"
              unoptimized
              className="h-24 w-24 rounded-2xl object-contain shadow-[0_16px_30px_-20px_rgba(15,23,42,0.65)] ring-1 ring-slate-200 sm:h-28 sm:w-28"
              priority
            />
            <div>
              <p className="utility-label">LeMans Service Plus OPC</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">Operations workspace</p>
            </div>
          </div>

          <p className="utility-label mb-3 text-brand-primary">Demo workspace</p>
          <h1
            id="demo-splash-heading"
            className="max-w-xl text-balance text-4xl font-extrabold leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-6xl"
          >
            Le Mans Operations
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
            One view for every vehicle, job, purchase, invoice, and payment in the service center.
          </p>

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <button
              onClick={enter}
              disabled={busy}
              aria-busy={busy}
              className="action-primary w-full text-base disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-6"
            >
              {busy ? 'Entering demo…' : 'Enter as an Admin'}
              {!busy && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
            <span className="text-sm text-slate-500">No password or account required</span>
          </div>

          {error && (
            <p
              className="mt-4 text-sm font-medium text-rose-700"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}

          <div className="surface-card-muted mt-8 flex max-w-xl gap-3 p-4 text-left text-sm text-slate-600">
            <Activity className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
            <p>
              This fictional walkthrough starts with a simulated Admin actor. Role switching and
              policy behavior are for demonstration only.
            </p>
          </div>
        </div>

        <aside
          className="surface-card relative overflow-hidden p-6 sm:p-8"
          aria-label="Demo workflow preview"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-brand-primary" aria-hidden="true" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="utility-label">Live workflow</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                From intake to collection
              </h2>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              5 checkpoints
            </span>
          </div>

          <ol className="mt-7 space-y-4">
            {[
              'Customer and vehicle',
              'Quotation and approval',
              'Job order and repair',
              'Parts and supplier invoice',
              'Billing and collection',
            ].map((stage, index) => (
              <li key={stage} className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    index === 0 ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {index === 0 ? <CircleCheck className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className="text-sm font-semibold text-slate-700">{stage}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
            Start with the seeded workflow, then switch roles to inspect each team&apos;s view.
          </div>
        </aside>
      </div>
    </section>
  );
}
