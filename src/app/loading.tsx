'use client';

export default function Loading() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      <div className="animate-pulse h-8 w-64 bg-slate-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-24 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-200 rounded-xl animate-pulse" />
      </div>
      <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
    </div>
  );
}
