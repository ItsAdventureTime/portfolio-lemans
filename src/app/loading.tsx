import { Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div
      className="space-y-8 sm:space-y-10"
      role="status"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <section
        className="surface-card relative overflow-hidden border-l-4 border-l-brand-primary p-5 sm:p-7"
        aria-hidden="true"
      >
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="w-full">
            <Skeleton className="h-3 w-40 bg-brand-primary/20" />
            <Skeleton className="mt-3 h-10 w-full max-w-md sm:h-12" />
            <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="surface-card flex min-h-32 flex-col justify-between border-t-2 border-t-brand-primary/50 p-4 sm:p-5"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-9 w-20" />
          </div>
        ))}
      </section>

      <section className="surface-card overflow-hidden" aria-hidden="true">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-3 w-52" />
          </div>
          <Skeleton className="h-11 w-20" />
        </div>
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex min-h-16 items-center justify-between px-5 py-3.5 sm:px-6"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0" />
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-2 h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
