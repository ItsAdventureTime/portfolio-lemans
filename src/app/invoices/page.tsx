import { getDemoRole } from '@/lib/actor';
import { listInvoices, createInvoiceFromJO, ApiError } from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';
import PageHeader from '@/components/PageHeader';
import InvoiceForm from './InvoiceForm';
import InvoiceList from './InvoiceList';
import { errorResult, FormResult, okResult } from '@/lib/form-result';

export default async function InvoicesPage() {
  const role = await getDemoRole();
  const invoices = await listInvoices(role);
  const canCreate = hasPermission(role, 'invoiceCreate');

  async function createAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
    'use server';
    const r = await (await import('@/lib/actor')).getDemoRole();
    const joId = String(formData.get('joId') ?? '').trim();

    if (!joId) {
      return errorResult(
        'Job Order ID is required.',
        { joId: 'Job Order ID is required' },
        { joId }
      );
    }

    try {
      await createInvoiceFromJO(joId, '', await r);
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResult(err.message, { joId: err.message }, { joId });
      }
      return errorResult(
        err instanceof Error ? err.message : 'Network error while creating invoice',
        { joId: 'Could not create invoice' },
        { joId }
      );
    }

    revalidatePath('/invoices');
    revalidatePath('/job-orders');
    return okResult('Invoice created.');
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
