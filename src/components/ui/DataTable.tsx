import EmptyState from './EmptyState';
import Skeleton from './Skeleton';

interface DataTableProps<T> {
  items: T[];
  columns: {
    key: string;
    header: string;
    render: (item: T) => React.ReactNode;
    className?: string;
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
      <section className="surface-card p-6" role="alert" aria-label="Table error">
        <p className="text-sm font-semibold text-rose-800">{error}</p>
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
        <table className="w-full text-sm" aria-label={caption}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-slate-50/80 text-slate-700">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`whitespace-nowrap px-4 py-3 text-left text-xs font-bold tracking-wide ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => (
              <tr key={idx} className="transition-colors hover:bg-slate-50/80">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 align-top text-slate-700 ${col.className ?? ''}`}
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
