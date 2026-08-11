import { getDemoRole } from '@/lib/actor';
import {
  listPurchaseRequests,
  listSupplierInvoices,
  createPurchaseRequest,
  createSupplierInvoice,
  listJobOrders,
  ApiError,
} from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';
import PageHeader from '@/components/PageHeader';
import { SectionCard } from '@/components/ui';
import type { JobOrder } from '@/lib/types';
import PurchaseRequestForm from './PurchaseRequestForm';
import PurchaseList from './PurchaseList';
import SupplierInvoiceForm from './SupplierInvoiceForm';
import SupplierInvoiceList from './SupplierInvoiceList';
import { errorResult, FormResult, okResult } from '@/lib/form-result';

export default async function PurchasingPage() {
  const role = await getDemoRole();
  const [purchaseRequests, supplierInvoices] = await Promise.all([
    listPurchaseRequests(role),
    listSupplierInvoices(role),
  ]);
  const jobOrders = await listJobOrdersForPurchasing(role);
  const canCreatePR = hasPermission(role, 'prCreate');
  const canCreateSI = hasPermission(role, 'supplierInvoiceCreate');

  async function createPRAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
    'use server';
    const r = await (await import('@/lib/actor')).getDemoRole();
    const supplier = String(formData.get('supplier') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const quantity = Number(formData.get('quantity'));
    const unitCost = Number(formData.get('unitCost'));
    const notes = String(formData.get('notes') ?? '').trim();

    const fieldErrors: Record<string, string> = {};
    if (!supplier) fieldErrors.supplier = 'Supplier is required';
    if (!description) fieldErrors.description = 'Description is required';
    if (Number.isNaN(quantity) || quantity <= 0) {
      fieldErrors.quantity = 'Enter a positive quantity';
    }
    if (Number.isNaN(unitCost) || unitCost <= 0) {
      fieldErrors.unitCost = 'Enter a positive unit cost';
    }

    const values = {
      supplier,
      description,
      quantity: Number.isNaN(quantity) ? '' : quantity,
      unitCost: Number.isNaN(unitCost) ? '' : unitCost,
      notes,
    };

    if (Object.keys(fieldErrors).length > 0) {
      return errorResult('Please correct the highlighted fields.', fieldErrors, values);
    }

    try {
      await createPurchaseRequest(
        {
          supplier,
          notes,
          items: [
            {
              description,
              quantity,
              unitCostCents: Math.round(unitCost * 100),
            },
          ],
        },
        await r
      );
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResult(err.message, undefined, values);
      }
      return errorResult(
        err instanceof Error ? err.message : 'Network error while creating purchase request',
        undefined,
        values
      );
    }

    revalidatePath('/purchasing');
    return okResult('Purchase request created.');
  }

  async function createSIAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
    'use server';
    const r = await (await import('@/lib/actor')).getDemoRole();
    const supplier = String(formData.get('supplier') ?? '').trim();
    const totalAmount = Number(formData.get('totalAmount'));
    const invoiceDate = String(formData.get('invoiceDate') ?? '').trim();
    const dueDate = String(formData.get('dueDate') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim();
    let allocations: { joId: string; amountCents: number; description: string }[] = [];
    try {
      const raw = JSON.parse(String(formData.get('allocations') ?? '[]'));
      if (Array.isArray(raw)) {
        allocations = raw
          .filter((item) => item && typeof item.joId === 'string')
          .map((item) => ({
            joId: item.joId,
            amountCents: Math.round(Number(item.amount || 0) * 100),
            description: String(item.description || '').trim(),
          }));
      }
    } catch {
      return errorResult('Allocation data is invalid. Please try again.');
    }

    const fieldErrors: Record<string, string> = {};
    if (!supplier) fieldErrors.supplier = 'Supplier is required';
    if (Number.isNaN(totalAmount) || totalAmount <= 0) {
      fieldErrors.totalAmount = 'Enter a positive total amount';
    }
    if (!invoiceDate) fieldErrors.invoiceDate = 'Invoice date is required';
    if (allocations.length > 0) {
      const allocatedCents = allocations.reduce((sum, item) => sum + item.amountCents, 0);
      if (allocatedCents !== Math.round(totalAmount * 100)) {
        fieldErrors.allocations = 'Allocations must equal the invoice total';
      }
    }

    const values = {
      supplier,
      totalAmount: Number.isNaN(totalAmount) ? '' : totalAmount,
      invoiceDate,
      dueDate,
      notes,
    };

    if (Object.keys(fieldErrors).length > 0) {
      return errorResult('Please correct the highlighted fields.', fieldErrors, values);
    }

    try {
      await createSupplierInvoice(
        {
          supplier,
          totalAmountCents: Math.round(totalAmount * 100),
          invoiceDate,
          dueDate,
          notes,
          allocations,
        },
        await r
      );
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResult(err.message, undefined, values);
      }
      return errorResult(
        err instanceof Error ? err.message : 'Network error while creating supplier invoice',
        undefined,
        values
      );
    }

    revalidatePath('/purchasing');
    revalidatePath('/dcs');
    return okResult('Supplier invoice created.');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchasing"
        description="Manage purchase requests, supplier invoices, and cost allocations."
      />

      <SectionCard title="Purchase Requests">
        {canCreatePR && <PurchaseRequestForm action={createPRAction} />}
        <div className={canCreatePR ? 'mt-4' : ''}>
          <PurchaseList purchaseRequests={purchaseRequests} role={role} />
        </div>
      </SectionCard>

      <SectionCard title="Supplier Invoices">
        {canCreateSI && <SupplierInvoiceForm jobOrders={jobOrders} action={createSIAction} />}
        <div className={canCreateSI ? 'mt-4' : ''}>
          <SupplierInvoiceList supplierInvoices={supplierInvoices} role={role} />
        </div>
      </SectionCard>
    </div>
  );
}

async function listJobOrdersForPurchasing(role: string) {
  const jos: JobOrder[] = await listJobOrders(role);
  return jos.map((jo) => ({
    id: jo.id,
    joNo: jo.jo_no,
    customerName: jo.customer_name,
    makeModel: jo.vehicle_make_model || '—',
  }));
}
