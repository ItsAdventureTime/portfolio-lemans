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
      <label htmlFor={name} className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
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
        className={`min-h-11 w-full px-3 py-2 rounded-lg border text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-brand-primary ${
          error ? 'border-rose-300 bg-rose-50' : 'border-slate-300'
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
        <p id={errorId} className="text-xs text-rose-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
