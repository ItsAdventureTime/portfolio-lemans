import { getDemoRole } from '@/lib/actor';
import {
  listPurchaseRequests,
  listSupplierInvoices,
  createPurchaseRequest,
  createSupplierInvoice,
  listJobOrders,
  ApiError,
} from '@/lib/api';
import { canAccessModule, hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';
import PageHeader from '@/components/PageHeader';
import AccessDenied from '@/components/AccessDenied';
import { SectionCard } from '@/components/ui';
import type { JobOrder } from '@/lib/types';
import PurchaseRequestForm from './PurchaseRequestForm';
import PurchaseList from './PurchaseList';
import SupplierInvoiceForm from './SupplierInvoiceForm';
import SupplierInvoiceList from './SupplierInvoiceList';
import { errorResult, FormResult, okResult } from '@/lib/form-result';
import { parsePesoToCents } from '@/lib/money';
import EndToEndWorkflowVisualizer from '@/components/EndToEndWorkflowVisualizer';

export default async function PurchasingPage() {
  const role = await getDemoRole();
  if (!canAccessModule(role, 'purchasing')) {
    return <AccessDenied role={role} requiredCapability="prCreate or supplierInvoiceCreate" />;
  }
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
    const unitCostInput = String(formData.get('unitCost') ?? '').trim();
    const unitCostCents = parsePesoToCents(unitCostInput);
    const notes = String(formData.get('notes') ?? '').trim();

    const fieldErrors: Record<string, string> = {};
    if (!supplier) fieldErrors.supplier = 'Supplier is required';
    if (!description) fieldErrors.description = 'Description is required';
    if (Number.isNaN(quantity) || quantity <= 0) {
      fieldErrors.quantity = 'Enter a positive quantity';
    }
    if (unitCostCents === null || unitCostCents <= 0) {
      fieldErrors.unitCost = 'Enter a positive unit cost';
    }

    const values = {
      supplier,
      description,
      quantity: Number.isNaN(quantity) ? '' : quantity,
      unitCost: unitCostInput,
      notes,
    };

    if (Object.keys(fieldErrors).length > 0) {
      return errorResult('Review the highlighted fields and try again.', fieldErrors, values);
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
              unitCostCents,
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
        err instanceof Error
          ? err.message
          : "We couldn't create the purchase request. Check your connection and try again.",
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
    const totalAmountInput = String(formData.get('totalAmount') ?? '').trim();
    const totalAmountCents = parsePesoToCents(totalAmountInput);
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
            amountCents: Number(item.amountCents ?? 0),
            description: String(item.description || '').trim(),
          }));
      }
    } catch {
      return errorResult('The allocation data is invalid. Review it and try again.');
    }

    const fieldErrors: Record<string, string> = {};
    if (!supplier) fieldErrors.supplier = 'Supplier is required';
    if (totalAmountCents === null || totalAmountCents <= 0) {
      fieldErrors.totalAmount = 'Enter a positive total amount';
    }
    if (!invoiceDate) fieldErrors.invoiceDate = 'Invoice date is required';
    if (allocations.length > 0) {
      const allocatedCents = allocations.reduce((sum, item) => sum + item.amountCents, 0);
      if (allocatedCents !== totalAmountCents) {
        fieldErrors.allocations = 'Allocations must equal the invoice total';
      }
    }

    const values = {
      supplier,
      totalAmount: totalAmountInput,
      invoiceDate,
      dueDate,
      notes,
    };

    if (Object.keys(fieldErrors).length > 0) {
      return errorResult('Review the highlighted fields and try again.', fieldErrors, values);
    }

    try {
      await createSupplierInvoice(
        {
          supplier,
          totalAmountCents,
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
        err instanceof Error
          ? err.message
          : "We couldn't create the supplier invoice. Check your connection and try again.",
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

      <EndToEndWorkflowVisualizer role={role} currentStage="PURCHASING" />

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
