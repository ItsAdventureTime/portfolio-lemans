import Link from 'next/link';
import { SearchX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
          <SearchX className="w-7 h-7 text-slate-600" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
          <p className="text-slate-600">The requested page does not exist or has been moved.</p>
        </div>
        <Link
          href="/lemans/demo"
          className="inline-flex items-center justify-center h-12 px-5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-hover transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Overview
        </Link>
      </div>
    </div>
  );
}
