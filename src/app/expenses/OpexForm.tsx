'use client';

import { useActionState } from 'react';
import { FormField } from '@/components/ui';
import FormError from '@/components/FormError';
import { FormResult } from '@/lib/form-result';
import { Plus, Loader2 } from 'lucide-react';

interface OpexFormProps {
  action: (prev: FormResult, formData: FormData) => Promise<FormResult>;
}

export default function OpexForm({ action }: OpexFormProps) {
  const [result, submitAction, isPending] = useActionState(action, {
    success: false,
    message: '',
    fieldErrors: {},
    values: {},
  });

  const values = result?.values ?? {};
  const fieldErrors = result?.fieldErrors ?? {};

  return (
    <form action={submitAction} noValidate className="surface-card space-y-4 p-4">
      <FormError message={result?.message} fieldErrors={fieldErrors} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Category"
          name="category"
          required
          placeholder="e.g., Utilities"
          defaultValue={values.category as string}
          error={fieldErrors.category}
        />
        <FormField
          label="Description"
          name="description"
          required
          placeholder="What is this for?"
          defaultValue={values.description as string}
          error={fieldErrors.description}
        />
        <FormField
          label="Amount (₱)"
          name="amount"
          type="number"
          step="0.01"
          min={0.01}
          required
          placeholder="0.00"
          defaultValue={values.amount as string}
          error={fieldErrors.amount}
        />
        <FormField
          label="Notes"
          name="notes"
          placeholder="Additional details"
          className="md:col-span-3"
          defaultValue={values.notes as string}
          error={fieldErrors.notes}
        />
      </div>
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
        Submit OPEX
      </button>
    </form>
  );
}
