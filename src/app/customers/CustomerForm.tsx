'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/ui';
import { Plus, Loader2 } from 'lucide-react';

interface CustomerFormProps {
  action: (formData: FormData) => void;
}

export default function CustomerForm({ action }: CustomerFormProps) {
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
        <FormField label="Customer No" name="customerNo" required placeholder="e.g., C-2026-001" />
        <FormField label="Name" name="name" required placeholder="Customer full name" />
        <FormField label="TIN" name="tin" placeholder="000-123-456-000" />
        <FormField label="Address" name="address" placeholder="Street, City" />
        <FormField label="Phone" name="phone" placeholder="09XX XXX XXXX" />
        <FormField label="Email" name="email" type="email" placeholder="contact@example.com" />
        <FormField label="Plate No" name="plateNo" required placeholder="ABC-1234" />
        <FormField label="Make/Model" name="makeModel" required placeholder="Toyota Hilux 4x4" />
        <FormField label="VIN/Chassis" name="vinChassis" placeholder="1HGCM82633A123456" />
        <FormField label="Engine No" name="engineNo" placeholder="ENG-987654321" />
        <FormField label="Year" name="year" placeholder="2022" />
        <FormField label="Color" name="color" placeholder="Super White" />
        <FormField
          label="Odometer"
          name="odometer"
          type="number"
          min={0}
          placeholder="45200"
          className="md:col-span-3"
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
        Add Customer & Vehicle
      </button>
    </form>
  );
}
