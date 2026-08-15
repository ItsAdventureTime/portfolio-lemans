'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import CascadingCustomerVehicleSelector from '@/components/cascading-customer-vehicle-selector';
import SalesQuoteBuilder, { SalesQuoteBuilderValue } from '@/components/sales-quote-builder';
import { FormField } from '@/components/ui';
import FormError from '@/components/FormError';
import { FormResult } from '@/lib/form-result';
import { Plus, Loader2 } from 'lucide-react';

interface QuotationFormProps {
  customers: { id: string; customerNo: string; name: string }[];
  vehicles: { id: string; customerId: string; plateNo: string; makeModel: string }[];
  action: (prev: FormResult, formData: FormData) => Promise<FormResult>;
}

export default function QuotationForm({ customers, vehicles, action }: QuotationFormProps) {
  const [builderValue, setBuilderValue] = useState<SalesQuoteBuilderValue | null>(null);
  const [customerId, setCustomerId] = useState<string>(
    (action as unknown as { values?: { customerId?: string } }).values?.customerId ?? ''
  );
  const [vehicleId, setVehicleId] = useState<string>(
    (action as unknown as { values?: { vehicleId?: string } }).values?.vehicleId ?? ''
  );
  const [result, submitAction, isPending] = useActionState(action, {
    success: false,
    message: '',
    fieldErrors: {},
    values: {},
  });

  const values = result?.values ?? {};
  const fieldErrors = result?.fieldErrors ?? {};
  const selectedCustomerId =
    (typeof values.customerId === 'string' && values.customerId) || customerId;
  const selectedVehicleId = (typeof values.vehicleId === 'string' && values.vehicleId) || vehicleId;

  return (
    <form action={submitAction} noValidate className="surface-card space-y-4 p-4">
      <FormError message={result?.message} fieldErrors={fieldErrors} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="hidden" name="customerId" value={selectedCustomerId} />
        <input type="hidden" name="vehicleId" value={selectedVehicleId} />
        <CascadingCustomerVehicleSelector
          customers={customers}
          vehicles={vehicles}
          customerName="customerId"
          vehicleName="vehicleId"
          selectedCustomerId={selectedCustomerId}
          selectedVehicleId={selectedVehicleId}
          onChange={(customerId, vehicleId) => {
            setCustomerId(customerId);
            setVehicleId(vehicleId);
          }}
        />
        <FormField
          label="Advisor"
          name="advisor"
          required
          placeholder="e.g., Juan Dela Cruz"
          defaultValue={values.advisor as string}
          error={fieldErrors.advisor}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Quote Items</label>
        <SalesQuoteBuilder name="__quote_builder_items" onChange={setBuilderValue} />
      </div>

      {builderValue && (
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(
            builderValue.items.map((it) => ({
              itemType: it.itemType,
              description: it.description,
              quantity: it.quantity,
              unitPriceCents: it.unitPriceCents,
              discountCents: it.discountCents,
            }))
          )}
        />
      )}

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
        Create Quotation
      </button>
    </form>
  );
}
