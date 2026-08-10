'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import CascadingCustomerVehicleSelector from '@/components/cascading-customer-vehicle-selector';
import SalesQuoteBuilder, { SalesQuoteBuilderValue } from '@/components/sales-quote-builder';
import { FormField } from '@/components/ui';
import { Plus, Loader2 } from 'lucide-react';

interface QuotationFormProps {
  customers: { id: string; customerNo: string; name: string }[];
  vehicles: { id: string; customerId: string; plateNo: string; makeModel: string }[];
  action: (formData: FormData) => void;
}

export default function QuotationForm({ customers, vehicles, action }: QuotationFormProps) {
  const [builderValue, setBuilderValue] = useState<SalesQuoteBuilderValue | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    if (builderValue) {
      formData.set(
        'items',
        JSON.stringify(
          builderValue.items.map((it) => ({
            itemType: it.itemType,
            description: it.description,
            quantity: it.quantity,
            unitPriceCents: Math.round(it.unitPrice * 100),
            discountCents: Math.round(it.discount * 100),
          }))
        )
      );
    }
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
        <CascadingCustomerVehicleSelector
          customers={customers}
          vehicles={vehicles}
          customerName="customerId"
          vehicleName="vehicleId"
        />
        <FormField label="Advisor" name="advisor" required placeholder="e.g., Juan Dela Cruz" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-700">Quote Items</label>
        <SalesQuoteBuilder onChange={setBuilderValue} />
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
        Create Quotation
      </button>
    </form>
  );
}
