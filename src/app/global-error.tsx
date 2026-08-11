'use client';

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
      <body className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4">
        <div
          className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5"
          role="alert"
          aria-live="assertive"
        >
          <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
            <AlertOctagon className="w-7 h-7 text-rose-600" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              We couldn&apos;t load the application
            </h1>
            <p className="text-slate-600">
              {error.message || 'Reload the application and try again.'}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center h-12 px-5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-hover transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
