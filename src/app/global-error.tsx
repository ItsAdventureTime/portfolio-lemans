'use client';

import './globals.css';
import { useEffect } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error boundary:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
        <div
          className="surface-card w-full max-w-md space-y-5 p-6 text-center sm:p-8"
          role="alert"
          aria-live="assertive"
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50"
            aria-hidden="true"
          >
            <AlertOctagon className="w-7 h-7 text-rose-600" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              We couldn&apos;t load the application
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              The application couldn&apos;t load. Please reload and try again.
            </p>
          </div>
          <button type="button" onClick={reset} className="action-primary">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
