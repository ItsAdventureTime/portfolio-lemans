'use client';

import './globals.css';
import { useEffect } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { getBasePath } from '@/lib/base-path';

const LOGO_SRC = `${getBasePath()}/lemans-service-plus-logo.jpg`;

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
      <body className="flex min-h-screen items-center justify-center bg-canvas px-4 text-slate-900">
        <div
          className="recovery-shell surface-card w-full max-w-md space-y-5 p-6 text-center sm:p-8"
          role="alert"
          aria-live="assertive"
        >
          <Image
            src={LOGO_SRC}
            alt="Le Mans Service Plus OPC logo"
            width={56}
            height={56}
            sizes="56px"
            unoptimized
            className="recovery-mark mx-auto h-14 w-14 object-contain"
          />
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50"
            aria-hidden="true"
          >
            <AlertOctagon className="h-6 w-6 text-rose-600" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="utility-label text-brand-primary">Le Mans operations</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
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
