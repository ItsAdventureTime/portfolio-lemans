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
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-light ring-1 ring-brand-primary/15">
        <Inbox className="h-7 w-7 text-brand-primary" aria-hidden="true" />
      </div>
      <p className="utility-label mb-1 text-brand-primary">Nothing in this view</p>
      <h3 className="text-lg font-bold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}
