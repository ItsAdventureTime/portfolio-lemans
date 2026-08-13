const STATUS_VARIANTS: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PARTS_PENDING: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  BILLED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  CLOSED: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PENDING_APPROVAL: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ALLOCATED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

interface StatusBadgeProps {
  status?: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = status || '';
  const upper = s.toUpperCase();
  const variant = STATUS_VARIANTS[upper] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };
  const label = upper.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-xs font-bold ${variant.bg} ${variant.text} ${variant.border}`}
      aria-label={`Status: ${label}`}
    >
      <span className="sr-only">Status: </span>
      {label}
    </span>
  );
}
