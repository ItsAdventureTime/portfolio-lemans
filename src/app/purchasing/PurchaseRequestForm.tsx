'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/ui';
import { Plus, Loader2 } from 'lucide-react';

interface PurchaseRequestFormProps {
  action: (formData: FormData) => void;
}

export default function PurchaseRequestForm({ action }: PurchaseRequestFormProps) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Supplier" name="supplier" required placeholder="Supplier name" />
        <FormField label="Notes" name="notes" placeholder="Optional notes" />
        <FormField
          label="Item Description"
          name="description"
          required
          placeholder="e.g., Brake pads"
          className="md:col-span-2"
        />
        <FormField
          label="Quantity"
          name="quantity"
          type="number"
          step="0.01"
          min={1}
          required
          placeholder="1"
        />
        <FormField
          label="Unit Cost (₱)"
          name="unitCost"
          type="number"
          step="0.01"
          min={0.01}
          required
          placeholder="0.00"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
