'use client';

export default function Loading() {
  return (
    <div
      className="min-h-[16rem] rounded-xl border border-slate-200 bg-white p-6"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div className="h-full w-1/3 bg-brand-primary motion-safe:animate-[loading-bar_1.5s_ease-in-out_infinite]" />
      </div>
      <p className="mt-5 text-sm text-slate-600">Loading this workspace…</p>
    </div>
  );
}
