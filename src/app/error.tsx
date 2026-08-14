'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { getBasePath } from '@/lib/base-path';

const LOGO_SRC = `${getBasePath()}/lemans-service-plus-logo.jpg`;

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
      <section className="recovery-shell surface-card w-full max-w-md space-y-5 p-6 text-center sm:p-8">
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
          <AlertTriangle className="h-6 w-6 text-rose-600" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="utility-label text-brand-primary">Le Mans operations</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            We couldn&apos;t load this page
          </h1>
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
