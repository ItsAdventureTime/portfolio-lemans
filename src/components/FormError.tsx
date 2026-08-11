'use client';

interface FormErrorProps {
  message?: string;
  fieldErrors?: Record<string, string>;
}

export default function FormError({ message, fieldErrors }: FormErrorProps) {
  if (!message && (!fieldErrors || Object.keys(fieldErrors).length === 0)) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
    >
      {message && <p className="font-semibold">{message}</p>}
      {fieldErrors && Object.keys(fieldErrors).length > 0 && (
        <ul className="mt-1 list-disc pl-5 space-y-0.5">
          {Object.entries(fieldErrors).map(([field, err]) => (
            <li key={field}>
              <span className="font-medium capitalize">
                {field.replace(/([A-Z])/g, ' $1').trim()}:
              </span>{' '}
              {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
