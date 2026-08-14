'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/ui';
import FormError from '@/components/FormError';
import { FormResult } from '@/lib/form-result';
import { Plus, Loader2 } from 'lucide-react';

interface CustomerFormProps {
  action: (prev: FormResult, formData: FormData) => Promise<FormResult>;
}

export default function CustomerForm({ action }: CustomerFormProps) {
  const router = useRouter();
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
      onSubmit={() => {
        if (result?.success) {
          router.refresh();
        }
      }}
      noValidate
      className="surface-card space-y-4 p-4"
    >
      <FormError message={result?.message} fieldErrors={fieldErrors} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Customer No"
          name="customerNo"
          required
          placeholder="e.g., C-2026-001"
          defaultValue={values.customerNo as string}
          error={fieldErrors.customerNo}
        />
        <FormField
          label="Name"
          name="name"
          required
          placeholder="Customer full name"
          defaultValue={values.name as string}
          error={fieldErrors.name}
        />
        <FormField
          label="TIN"
          name="tin"
          placeholder="000-123-456-000"
          defaultValue={values.tin as string}
          error={fieldErrors.tin}
        />
        <FormField
          label="Address"
          name="address"
          placeholder="Street, City"
          defaultValue={values.address as string}
          error={fieldErrors.address}
        />
        <FormField
          label="Phone"
          name="phone"
          placeholder="09XX XXX XXXX"
          defaultValue={values.phone as string}
          error={fieldErrors.phone}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          placeholder="contact@example.com"
          defaultValue={values.email as string}
          error={fieldErrors.email}
        />
        <FormField
          label="Plate No"
          name="plateNo"
          required
          placeholder="ABC-1234"
          defaultValue={values.plateNo as string}
          error={fieldErrors.plateNo}
        />
        <FormField
          label="Make/Model"
          name="makeModel"
          required
          placeholder="Toyota Hilux 4x4"
          defaultValue={values.makeModel as string}
          error={fieldErrors.makeModel}
        />
        <FormField
          label="VIN/Chassis"
          name="vinChassis"
          placeholder="1HGCM82633A123456"
          defaultValue={values.vinChassis as string}
          error={fieldErrors.vinChassis}
        />
        <FormField
          label="Engine No"
          name="engineNo"
          placeholder="ENG-987654321"
          defaultValue={values.engineNo as string}
          error={fieldErrors.engineNo}
        />
        <FormField
          label="Year"
          name="year"
          placeholder="2022"
          defaultValue={values.year as string}
          error={fieldErrors.year}
        />
        <FormField
          label="Color"
          name="color"
          placeholder="Super White"
          defaultValue={values.color as string}
          error={fieldErrors.color}
        />
        <FormField
          label="Odometer"
          name="odometer"
          type="number"
          min={0}
          placeholder="45200"
          className="md:col-span-3"
          defaultValue={values.odometer as string}
          error={fieldErrors.odometer}
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
        Add Customer & Vehicle
      </button>
    </form>
  );
}
