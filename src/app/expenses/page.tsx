import { getDemoRole } from '@/lib/actor';
import { listOpexRequests, createOpexRequest } from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';
import PageHeader from '@/components/PageHeader';
import OpexForm from './OpexForm';
import OpexList from './OpexList';

export default async function ExpensesPage() {
  const role = await getDemoRole();
  const opexRequests = await listOpexRequests(role);
  const canCreate = hasPermission(role, 'opexCreate');

  async function createAction(formData: FormData) {
    'use server';
    const currentRole = (await import('@/lib/actor')).getDemoRole();
    const category = String(formData.get('category')).trim();
    const description = String(formData.get('description')).trim();
    const amount = Number(formData.get('amount'));
    if (!category || !description || Number.isNaN(amount) || amount <= 0) {
      throw new Error('Category, description, and a positive amount are required');
    }
    await createOpexRequest(
      {
        category,
        description,
        amountCents: Math.round(amount * 100),
        notes: String(formData.get('notes')),
      },
      await currentRole
    );
    revalidatePath('/expenses');
    revalidatePath('/dcs');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="OPEX Requests"
        description="Submit and approve operational expense requests."
      />

      {canCreate && <OpexForm action={createAction} />}

      <OpexList requests={opexRequests} role={role} />
    </div>
  );
}
