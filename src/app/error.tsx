'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error boundary:', error);
  }, [error]);

  return (
    <div
      className="min-h-[50vh] flex items-center justify-center px-4"
      role="alert"
      aria-live="assertive"
    >
      <section className="surface-card w-full max-w-md space-y-5 p-6 text-center sm:p-8">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50"
          aria-hidden="true"
        >
          <AlertTriangle className="w-7 h-7 text-rose-600" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">We couldn&apos;t load this page</h1>
          <p className="text-sm leading-6 text-slate-600">
            We couldn&apos;t load this page. Please try again.
          </p>
        </div>
        <button type="button" onClick={reset} className="action-primary">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </section>
    </div>
  );
}
