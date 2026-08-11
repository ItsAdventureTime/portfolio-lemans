import { getDemoRole } from '@/lib/actor';
import { listCustomers, createCustomerAndVehicle, ApiError } from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';
import PageHeader from '@/components/PageHeader';
import CustomerForm from './CustomerForm';
import CustomerList from './CustomerList';
import { errorResult, FormResult, okResult } from '@/lib/form-result';

export default async function CustomersPage() {
  const role = await getDemoRole();
  const customers = await listCustomers(role);
  const canCreate = hasPermission(role, 'customerCreate');

  async function createFormAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
    'use server';
    const currentRole = await (await import('@/lib/actor')).getDemoRole();
    const customer = {
      customerNo: String(formData.get('customerNo') ?? '').trim(),
      name: String(formData.get('name') ?? '').trim(),
      tin: String(formData.get('tin') ?? '').trim(),
      address: String(formData.get('address') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
    };
    const vehicle = {
      plateNo: String(formData.get('plateNo') ?? '').trim(),
      makeModel: String(formData.get('makeModel') ?? '').trim(),
      vinChassis: String(formData.get('vinChassis') ?? '').trim(),
      engineNo: String(formData.get('engineNo') ?? '').trim(),
      year: String(formData.get('year') ?? '').trim(),
      color: String(formData.get('color') ?? '').trim(),
      odometer: Number(formData.get('odometer')),
    };

    const fieldErrors: Record<string, string> = {};
    if (!customer.customerNo) fieldErrors.customerNo = 'Customer No is required';
    if (!customer.name) fieldErrors.name = 'Name is required';
    if (!vehicle.plateNo) fieldErrors.plateNo = 'Plate No is required';
    if (!vehicle.makeModel) fieldErrors.makeModel = 'Make/Model is required';

    const values: Record<string, string | number | undefined> = {
      ...customer,
      ...vehicle,
      odometer: Number.isNaN(vehicle.odometer) ? undefined : vehicle.odometer,
    };

    if (Object.keys(fieldErrors).length > 0) {
      return errorResult('Review the highlighted fields and try again.', fieldErrors, values);
    }

    try {
      await createCustomerAndVehicle({ customer, vehicle }, await currentRole);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const message = err.message.includes('customer')
            ? 'Customer number already exists.'
            : 'Plate number already exists.';
          return errorResult(message, undefined, values);
        }
        return errorResult(err.message, undefined, values);
      }
      return errorResult(
        err instanceof Error
          ? err.message
          : "We couldn't save the customer. Check your connection and try again.",
        undefined,
        values
      );
    }

    revalidatePath('/customers');
    return okResult('Customer and vehicle added.');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers & Vehicles"
        description="Manage customer accounts and their registered vehicles."
      />

      {canCreate && <CustomerForm action={createFormAction} />}

      <CustomerList customers={customers} />
    </div>
  );
}
