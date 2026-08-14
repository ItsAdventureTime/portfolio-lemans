import Link from 'next/link';
import { SearchX, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { getBasePath } from '@/lib/base-path';

const LOGO_SRC = `${getBasePath()}/lemans-service-plus-logo.jpg`;

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
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
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light"
          aria-hidden="true"
        >
          <SearchX className="h-6 w-6 text-brand-primary" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="utility-label text-brand-primary">Le Mans operations</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Page not found</h1>
          <p className="text-sm leading-6 text-slate-600">
            This page is unavailable. It may have moved or no longer be available.
          </p>
        </div>
        <Link href="/" className="action-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Return to overview
        </Link>
      </section>
    </div>
  );
}
