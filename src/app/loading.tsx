import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <section
      className="surface-card-muted max-w-screen-xl space-y-5 p-5 sm:p-6"
      role="status"
      aria-label="Loading workspace"
      aria-busy="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="space-y-2">
          <p className="utility-label text-brand-primary">Le Mans Operations</p>
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-11 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-48 w-full" />
    </section>
  );
}
