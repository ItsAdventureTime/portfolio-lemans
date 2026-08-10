'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/ui';
import { Plus, Loader2 } from 'lucide-react';
import MultiJoAllocationModal, { AllocationLine } from '@/components/multi-jo-allocation-modal';

interface JobOrderOption {
  id: string;
  joNo: string;
  customerName: string;
  makeModel: string;
}

interface SupplierInvoiceFormProps {
  jobOrders: JobOrderOption[];
  action: (formData: FormData) => void;
}

export default function SupplierInvoiceForm({ jobOrders, action }: SupplierInvoiceFormProps) {
  const [allocations, setAllocations] = useState<AllocationLine[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    const total = Number(formData.get('totalAmount'));
    formData.set('totalAmountCents', String(Math.round(total * 100)));
    formData.set('allocations', JSON.stringify(allocations));
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
        <FormField label="Supplier" name="supplier" required placeholder="Supplier name" />
        <FormField
          label="Total Amount (₱)"
          name="totalAmount"
          type="number"
          step="0.01"
          min={0.01}
          required
          placeholder="0.00"
        />
        <FormField label="Invoice Date" name="invoiceDate" type="date" />
        <FormField label="Due Date" name="dueDate" type="date" />
        <FormField
          label="Notes"
          name="notes"
          placeholder="Optional notes"
          className="md:col-span-2"
        />
      </div>

      <input type="hidden" name="allocations" value={JSON.stringify(allocations)} />
      <input type="hidden" name="totalAmountCents" />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const total = Number(
              (document.getElementById('totalAmount') as HTMLInputElement)?.value || 0
            );
            setTotalAmount(total);
            setShowModal(true);
          }}
          className="inline-flex items-center h-9 px-4 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Allocate Across JOs
        </button>
        {allocations.length > 0 && (
          <span className="text-sm text-emerald-700 font-medium">
            {allocations.length} allocation(s) saved
          </span>
        )}
      </div>

      <MultiJoAllocationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        invoiceAmount={totalAmount}
        jobOrders={jobOrders}
        initialAllocations={allocations}
        onSave={setAllocations}
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
        Create Supplier Invoice
      </button>
    </form>
  );
}
