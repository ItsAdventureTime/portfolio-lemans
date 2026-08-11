export interface FormResult {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string | number | undefined>;
}

export function okResult(message?: string): FormResult {
  return { success: true, message };
}

export function errorResult(
  message: string,
  fieldErrors?: Record<string, string>,
  values?: Record<string, string | number | undefined>
): FormResult {
  return { success: false, message, fieldErrors, values };
}

export function singleFieldError(field: string, message: string, value?: string): FormResult {
  return {
    success: false,
    message,
    fieldErrors: { [field]: message },
    values: value !== undefined ? { [field]: value } : undefined,
  };
}
