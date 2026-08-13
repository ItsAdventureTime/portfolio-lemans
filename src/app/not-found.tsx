import Link from 'next/link';
import { SearchX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <section className="surface-card w-full max-w-md space-y-5 p-6 text-center sm:p-8">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100"
          aria-hidden="true"
        >
          <SearchX className="w-7 h-7 text-slate-600" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
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
