import { getDemoRole } from '@/lib/actor';
import { listCustomers, createCustomerAndVehicle } from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';
import PageHeader from '@/components/PageHeader';
import CustomerForm from './CustomerForm';
import CustomerList from './CustomerList';

export default async function CustomersPage() {
  const role = await getDemoRole();
  const customers = await listCustomers(role);
  const canCreate = hasPermission(role, 'customerCreate');

  async function createFormAction(formData: FormData) {
    'use server';
    const currentRole = (await import('@/lib/actor')).getDemoRole();
    const customer = {
      customerNo: String(formData.get('customerNo')),
      name: String(formData.get('name')),
      tin: String(formData.get('tin')),
      address: String(formData.get('address')),
      phone: String(formData.get('phone')),
      email: String(formData.get('email')),
    };
    const vehicle = {
      plateNo: String(formData.get('plateNo')),
      makeModel: String(formData.get('makeModel')),
      vinChassis: String(formData.get('vinChassis')),
      engineNo: String(formData.get('engineNo')),
      year: String(formData.get('year')),
      color: String(formData.get('color')),
      odometer: Number(formData.get('odometer')),
    };
    if (!customer.customerNo || !customer.name || !vehicle.plateNo || !vehicle.makeModel) {
      throw new Error('Customer No, Name, Plate No, and Make/Model are required');
    }
    await createCustomerAndVehicle({ customer, vehicle }, await currentRole);
    revalidatePath('/customers');
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
