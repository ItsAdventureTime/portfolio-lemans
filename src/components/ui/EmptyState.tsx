import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = 'Nothing to show yet',
  description = 'There is nothing to display here yet.',
  action,
}: EmptyStateProps) {
  return (
    <section
      className="surface-card flex flex-col items-center justify-center p-8 text-center sm:p-10"
      aria-label={title}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200">
        <Inbox className="h-7 w-7 text-slate-500" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-600">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}
