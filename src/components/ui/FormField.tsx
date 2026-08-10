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
  className = '',
}: FormFieldProps) {
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
        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
        aria-describedby={helpText ? `${name}-help` : undefined}
      />
      {helpText && (
        <p id={`${name}-help`} className="text-xs text-slate-500">
          {helpText}
        </p>
      )}
    </div>
  );
}
