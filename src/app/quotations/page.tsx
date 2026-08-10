import { getDemoRole } from '@/lib/actor';
import { listQuotations, createSalesQuotation, listCustomers, listVehicles } from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';
import PageHeader from '@/components/PageHeader';
import QuotationForm from './QuotationForm';
import QuotationList from './QuotationList';

export default async function QuotationsPage() {
  const role = await getDemoRole();
  const [quotes, customers, vehicles] = await Promise.all([
    listQuotations(role),
    listCustomers(role),
    listVehicles(role),
  ]);
  const canCreate = hasPermission(role, 'salesQuotationCreate');

  async function createAction(formData: FormData) {
    'use server';
    const currentRole = (await import('@/lib/actor')).getDemoRole();
    const items = JSON.parse(String(formData.get('items') || '[]'));
    await createSalesQuotation(
      {
        customerId: String(formData.get('customerId')),
        vehicleId: String(formData.get('vehicleId')),
        advisor: String(formData.get('advisor')),
        items,
      },
      await currentRole
    );
    revalidatePath('/quotations');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Quotations"
        description="Create, approve, and convert quotations into job orders."
      />

      {canCreate && (
        <QuotationForm customers={customers} vehicles={vehicles} action={createAction} />
      )}

      <QuotationList quotes={quotes} role={role} />
    </div>
  );
}
