interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="utility-label mb-2 text-brand-primary">Le Mans operations</p>
        <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-slate-950">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
