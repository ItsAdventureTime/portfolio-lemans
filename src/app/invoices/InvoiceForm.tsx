'use client';

import { useActionState } from 'react';
import { FormField } from '@/components/ui';
import FormError from '@/components/FormError';
import { FormResult } from '@/lib/form-result';
import { Plus, Loader2 } from 'lucide-react';

interface InvoiceFormProps {
  action: (prev: FormResult, formData: FormData) => Promise<FormResult>;
}

export default function InvoiceForm({ action }: InvoiceFormProps) {
  const [result, submitAction, isPending] = useActionState(action, {
    success: false,
    message: '',
    fieldErrors: {},
    values: {},
  });

  return (
    <form
      action={submitAction}
      noValidate
      className="surface-card flex flex-wrap items-end gap-3 p-4"
    >
      <FormError message={result?.message} fieldErrors={result?.fieldErrors} />
      <FormField
        label="Job Order ID"
        name="joId"
        required
        placeholder="RA0000001 or UUID"
        className="flex-1 min-w-[200px]"
        defaultValue={result?.values?.joId as string}
        error={result?.fieldErrors?.joId}
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center h-12 px-5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        Create Invoice
      </button>
    </form>
  );
}
