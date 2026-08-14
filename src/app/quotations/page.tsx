import { getDemoRole } from '@/lib/actor';
import {
  listQuotations,
  createSalesQuotation,
  listCustomers,
  listVehicles,
  ApiError,
} from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';
import PageHeader from '@/components/PageHeader';
import QuotationForm from './QuotationForm';
import QuotationList from './QuotationList';
import { errorResult, FormResult, okResult } from '@/lib/form-result';
import type { Customer, Vehicle } from '@/lib/types';
import EndToEndWorkflowVisualizer from '@/components/EndToEndWorkflowVisualizer';

export default async function QuotationsPage() {
  const role = await getDemoRole();
  const [quotes, customersRaw, vehiclesRaw] = await Promise.all([
    listQuotations(role),
    listCustomers(role),
    listVehicles(role),
  ]);
  const customers = customersRaw.map((c: Customer) => ({
    id: c.id,
    customerNo: c.customer_no,
    name: c.name,
  }));
  const vehicles = vehiclesRaw.map((v: Vehicle) => ({
    id: v.id,
    customerId: v.customer_id,
    plateNo: v.plate_no,
    makeModel: v.make_model,
  }));
  const canCreate = hasPermission(role, 'salesQuotationCreate');

  async function createAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
    'use server';
    const r = await (await import('@/lib/actor')).getDemoRole();
    const customerId = String(formData.get('customerId') ?? '').trim();
    const vehicleId = String(formData.get('vehicleId') ?? '').trim();
    const advisor = String(formData.get('advisor') ?? '').trim();

    const fieldErrors: Record<string, string> = {};
    if (!customerId) fieldErrors.customerId = 'Customer is required';
    if (!vehicleId) fieldErrors.vehicleId = 'Vehicle is required';
    if (!advisor) fieldErrors.advisor = 'Advisor is required';

    const itemsRaw = JSON.parse(String(formData.get('items') ?? '[]'));
    const items = Array.isArray(itemsRaw)
      ? itemsRaw.map((it) => ({
          itemType: String(it.itemType ?? ''),
          description: String(it.description ?? ''),
          quantity: Number(it.quantity ?? 0),
          unitPriceCents: Number(it.unitPriceCents ?? 0),
          discountCents: Number(it.discountCents ?? 0),
        }))
      : [];

    if (items.length === 0) {
      fieldErrors.items = 'Add at least one quote item';
    }

    const values = { customerId, vehicleId, advisor };

    if (Object.keys(fieldErrors).length > 0) {
      return errorResult('Review the highlighted fields and try again.', fieldErrors, values);
    }

    try {
      await createSalesQuotation({ customerId, vehicleId, advisor, items }, await r);
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResult(err.message, undefined, values);
      }
      return errorResult(
        err instanceof Error
          ? err.message
          : "We couldn't create the quotation. Check your connection and try again.",
        undefined,
        values
      );
    }

    revalidatePath('/quotations');
    revalidatePath('/job-orders');
    return okResult('Quotation created.');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Quotations"
        description="Create, approve, and convert quotations into job orders."
      />

      <EndToEndWorkflowVisualizer role={role} currentStage="QUOTATION" />

      {canCreate && (
        <QuotationForm customers={customers} vehicles={vehicles} action={createAction} />
      )}

      <QuotationList quotes={quotes} role={role} />
    </div>
  );
}
