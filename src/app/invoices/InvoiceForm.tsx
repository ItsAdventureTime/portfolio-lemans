'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/ui';
import { Plus, Loader2 } from 'lucide-react';

interface InvoiceFormProps {
  action: (formData: FormData) => void;
}

export default function InvoiceForm({ action }: InvoiceFormProps) {
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
      className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-end gap-3"
    >
      <FormField
        label="Job Order ID"
        name="joId"
        required
        placeholder="RA0000001 or UUID"
        className="flex-1 min-w-[200px]"
      />
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
        Create Invoice
      </button>
    </form>
  );
}
