const STATUS_VARIANTS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700' },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700' },
  PARTS_PENDING: { bg: 'bg-orange-50', text: 'text-orange-700' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  BILLED: { bg: 'bg-blue-50', text: 'text-blue-700' },
  CLOSED: { bg: 'bg-slate-100', text: 'text-slate-700' },
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700' },
  PENDING_APPROVAL: { bg: 'bg-amber-50', text: 'text-amber-700' },
  ALLOCATED: { bg: 'bg-blue-50', text: 'text-blue-700' },
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700' },
};

interface StatusBadgeProps {
  status?: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = status || '';
  const upper = s.toUpperCase();
  const variant = STATUS_VARIANTS[upper] || { bg: 'bg-slate-100', text: 'text-slate-700' };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variant.bg} ${variant.text}`}
    >
      {upper.replace(/_/g, ' ')}
    </span>
  );
}
