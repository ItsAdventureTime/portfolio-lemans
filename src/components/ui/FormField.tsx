interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  min?: string | number;
  step?: string;
  helpText?: string;
  error?: string;
  className?: string;
}

export default function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  defaultValue,
  min,
  step,
  helpText,
  error,
  className = '',
}: FormFieldProps) {
  const errorId = error ? `${name}-error` : undefined;
  const helpId = helpText ? `${name}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm text-slate-700">
        {label}
        {required && (
          <>
            <span className="ml-1 text-rose-500" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> required</span>
          </>
        )}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        min={min}
        step={step}
        className={`min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary ${
          error ? 'border-rose-300 bg-rose-50' : 'border-slate-300 hover:border-slate-400'
        }`}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : undefined}
      />
      {helpText && !error && (
        <p id={helpId} className="text-xs text-slate-500">
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
