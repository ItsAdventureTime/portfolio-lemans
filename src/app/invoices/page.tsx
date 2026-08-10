import { getDemoRole } from '@/lib/actor';
import { listInvoices, createInvoiceFromJO } from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';
import PageHeader from '@/components/PageHeader';
import InvoiceForm from './InvoiceForm';
import InvoiceList from './InvoiceList';

export default async function InvoicesPage() {
  const role = await getDemoRole();
  const invoices = await listInvoices(role);
  const canCreate = hasPermission(role, 'invoiceCreate');

  async function createAction(formData: FormData) {
    'use server';
    const r = (await import('@/lib/actor')).getDemoRole();
    const joId = String(formData.get('joId')).trim();
    if (!joId) {
      throw new Error('Job Order ID is required');
    }
    await createInvoiceFromJO(joId, '', await r);
    revalidatePath('/invoices');
    revalidatePath('/job-orders');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices & Collections"
        description="Create invoices from job orders and record customer payments."
      />

      {canCreate && <InvoiceForm action={createAction} />}

      <InvoiceList invoices={invoices} role={role} />
    </div>
  );
}
