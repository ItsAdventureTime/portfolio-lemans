interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  description?: string;
  action?: React.ReactNode;
  headingId?: string;
}

export default function SectionCard({
  title,
  children,
  className = '',
  description,
  action,
  headingId,
}: SectionCardProps) {
  const resolvedHeadingId =
    headingId ?? `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <section className={`surface-card p-4 sm:p-5 ${className}`} aria-labelledby={resolvedHeadingId}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 id={resolvedHeadingId} className="text-lg font-bold tracking-tight text-slate-950">
            {title}
          </h2>
          {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {children}
    </section>
  );
}
