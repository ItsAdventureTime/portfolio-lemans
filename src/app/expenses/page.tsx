import { getDemoRole } from '@/lib/actor';
import { listOpexRequests, createOpexRequest, ApiError } from '@/lib/api';
import { hasPermission } from '@/lib/roles';
import { revalidatePath } from 'next/cache';
import PageHeader from '@/components/PageHeader';
import OpexForm from './OpexForm';
import OpexList from './OpexList';
import { errorResult, FormResult, okResult } from '@/lib/form-result';

export default async function ExpensesPage() {
  const role = await getDemoRole();
  const opexRequests = await listOpexRequests(role);
  const canCreate = hasPermission(role, 'opexCreate');

  async function createAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
    'use server';
    const currentRole = await (await import('@/lib/actor')).getDemoRole();
    const category = String(formData.get('category') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const amount = Number(formData.get('amount'));
    const notes = String(formData.get('notes') ?? '').trim();

    const fieldErrors: Record<string, string> = {};
    if (!category) fieldErrors.category = 'Category is required';
    if (!description) fieldErrors.description = 'Description is required';
    if (Number.isNaN(amount) || amount <= 0) {
      fieldErrors.amount = 'Enter a positive amount';
    }

    const values = { category, description, amount: Number.isNaN(amount) ? '' : amount, notes };

    if (Object.keys(fieldErrors).length > 0) {
      return errorResult('Review the highlighted fields and try again.', fieldErrors, values);
    }

    try {
      await createOpexRequest(
        {
          category,
          description,
          amountCents: Math.round(amount * 100),
          notes,
        },
        await currentRole
      );
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResult(err.message, undefined, values);
      }
      return errorResult(
        err instanceof Error
          ? err.message
          : "We couldn't submit the OPEX request. Check your connection and try again.",
        undefined,
        values
      );
    }

    revalidatePath('/expenses');
    revalidatePath('/dcs');
    return okResult('OPEX request submitted.');
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
