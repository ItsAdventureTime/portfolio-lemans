'use client';

import { useActionState } from 'react';
import { FormField } from '@/components/ui';
import FormError from '@/components/FormError';
import { FormResult } from '@/lib/form-result';
import { Plus, Loader2 } from 'lucide-react';

interface PurchaseRequestFormProps {
  action: (prev: FormResult, formData: FormData) => Promise<FormResult>;
}

export default function PurchaseRequestForm({ action }: PurchaseRequestFormProps) {
  const [result, submitAction, isPending] = useActionState(action, {
    success: false,
    message: '',
    fieldErrors: {},
    values: {},
  });

  const values = result?.values ?? {};
  const fieldErrors = result?.fieldErrors ?? {};

  return (
    <form
      action={submitAction}
      noValidate
      className="bg-white p-4 rounded-xl border border-slate-200 space-y-4"
    >
      <FormError message={result?.message} fieldErrors={fieldErrors} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Supplier"
          name="supplier"
          required
          placeholder="Supplier name"
          defaultValue={values.supplier as string}
          error={fieldErrors.supplier}
        />
        <FormField
          label="Notes"
          name="notes"
          placeholder="Optional notes"
          defaultValue={values.notes as string}
          error={fieldErrors.notes}
        />
        <FormField
          label="Item Description"
          name="description"
          required
          placeholder="e.g., Brake pads"
          className="md:col-span-2"
          defaultValue={values.description as string}
          error={fieldErrors.description}
        />
        <FormField
          label="Quantity"
          name="quantity"
          type="number"
          step="0.01"
          min={1}
          required
          placeholder="1"
          defaultValue={values.quantity as string}
          error={fieldErrors.quantity}
        />
        <FormField
          label="Unit Cost (₱)"
          name="unitCost"
          type="number"
          step="0.01"
          min={0.01}
          required
          placeholder="0.00"
          defaultValue={values.unitCost as string}
          error={fieldErrors.unitCost}
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
        Create Purchase Request
      </button>
    </form>
  );
}
