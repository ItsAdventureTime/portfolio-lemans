import EmptyState from './EmptyState';
import Skeleton from './Skeleton';
import { AlertTriangle } from 'lucide-react';

interface DataTableProps<T> {
  items: T[];
  columns: {
    key: string;
    header: string;
    render: (item: T) => React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
    numeric?: boolean;
    widthClass?: string;
  }[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  caption?: string;
  loading?: boolean;
  error?: string;
  errorAction?: React.ReactNode;
}

export default function DataTable<T>({
  items,
  columns,
  emptyTitle,
  emptyDescription,
  emptyAction,
  caption,
  loading = false,
  error,
  errorAction,
}: DataTableProps<T>) {
  const columnClassName = (column: DataTableProps<T>['columns'][number]) => {
    const alignment = column.align ?? (column.numeric ? 'right' : 'left');
    const alignmentClass =
      alignment === 'right' ? 'text-right' : alignment === 'center' ? 'text-center' : 'text-left';

    return [
      alignmentClass,
      column.numeric ? 'tabular-nums' : '',
      column.widthClass,
      column.className,
    ]
      .filter(Boolean)
      .join(' ');
  };

  if (loading) {
    return (
      <div className="surface-card overflow-hidden" aria-busy="true" aria-label="Loading table">
        <div className="space-y-3 p-4 sm:p-5" aria-hidden="true">
          {Array.from({ length: 4 }, (_, row) => (
            <div key={row} className="grid grid-cols-3 gap-4">
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section
        className="surface-card border-l-4 border-l-rose-500 bg-rose-50/40 p-5 sm:p-6"
        role="alert"
        aria-label="Table error"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
          <p className="text-sm font-semibold leading-6 text-rose-900">{error}</p>
        </div>
        {errorAction && <div className="mt-4">{errorAction}</div>}
      </section>
    );
  }

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table min-w-full table-fixed text-sm" aria-label={caption}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`whitespace-nowrap border-b border-slate-200/80 px-4 py-3 font-semibold leading-4 ${columnClassName(col)}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {items.map((item, idx) => (
              <tr key={idx} className="transition-colors hover:bg-slate-50/80">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`border-b border-slate-200/70 px-4 py-3 align-middle leading-6 text-slate-700 ${columnClassName(col)}`}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
