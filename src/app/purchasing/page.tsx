import { getDemoRole } from '@/lib/actor';
import {
  listPurchaseRequests,
  listSupplierInvoices,
  createPurchaseRequest,
  createSupplierInvoice,
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

export default async function PurchasingPage() {
  const role = await getDemoRole();
  const [purchaseRequests, supplierInvoices, jobOrders] = await Promise.all([
    listPurchaseRequests(role),
    listSupplierInvoices(role),
    listJobOrdersForPurchasing(role),
  ]);
  const canCreatePR = hasPermission(role, 'prCreate');
  const canCreateSI = hasPermission(role, 'supplierInvoiceCreate');

  async function createPRAction(formData: FormData) {
    'use server';
    const r = (await import('@/lib/actor')).getDemoRole();
    const supplier = String(formData.get('supplier')).trim();
    const description = String(formData.get('description')).trim();
    const quantity = Number(formData.get('quantity'));
    const unitCost = Number(formData.get('unitCost'));
    if (
      !supplier ||
      !description ||
      Number.isNaN(quantity) ||
      quantity <= 0 ||
      Number.isNaN(unitCost) ||
      unitCost <= 0
    ) {
      throw new Error(
        'Supplier, description, positive quantity, and positive unit cost are required'
      );
    }
    const items = [
      {
        description,
        quantity,
        unitCostCents: Math.round(unitCost * 100),
      },
    ];
    await createPurchaseRequest(
      {
        supplier,
        notes: String(formData.get('notes')),
        items,
      },
      await r
    );
    revalidatePath('/purchasing');
  }

  async function createSIAction(formData: FormData) {
    'use server';
    const r = (await import('@/lib/actor')).getDemoRole();
    const supplier = String(formData.get('supplier')).trim();
    const totalAmountCents = Number(formData.get('totalAmountCents'));
    const invoiceDate = String(formData.get('invoiceDate'));
    if (!supplier || Number.isNaN(totalAmountCents) || totalAmountCents <= 0 || !invoiceDate) {
      throw new Error('Supplier, positive total amount, and invoice date are required');
    }
    await createSupplierInvoice(
      {
        supplier,
        totalAmountCents,
        invoiceDate,
        dueDate: String(formData.get('dueDate')),
        notes: String(formData.get('notes')),
      },
      await r
    );
    revalidatePath('/purchasing');
    revalidatePath('/dcs');
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
  const { listJobOrders } = await import('@/lib/api');
  const jos: JobOrder[] = await listJobOrders(role);
  return jos.map((jo) => ({
    id: jo.id,
    joNo: jo.jo_no,
    customerName: jo.customer_name,
    makeModel: jo.vehicle_make_model || '—',
  }));
}
