'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/ui';
import { Plus, Loader2 } from 'lucide-react';

interface OpexFormProps {
  action: (formData: FormData) => void;
}

export default function OpexForm({ action }: OpexFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(() => {
      action(formData);
      router.refresh();
    });
  }

  return (
    <form
      action={handleSubmit}
      className="bg-white p-4 rounded-xl border border-slate-200 space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Category" name="category" required placeholder="e.g., Utilities" />
        <FormField
          label="Description"
          name="description"
          required
          placeholder="What is this for?"
        />
        <FormField
          label="Amount (₱)"
          name="amount"
          type="number"
          step="0.01"
          min={0.01}
          required
          placeholder="0.00"
        />
        <FormField
          label="Notes"
          name="notes"
          placeholder="Additional details"
          className="md:col-span-3"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
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
