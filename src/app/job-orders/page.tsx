import { getDemoRole } from '@/lib/actor';
import { listJobOrders } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import JobOrderList from './JobOrderList';

export default async function JobOrdersPage() {
  const role = await getDemoRole();
  const jobOrders = await listJobOrders(role);

  return (
    <div className="space-y-6">
      <PageHeader title="Job Orders" description="Track active and completed service job orders." />
      <JobOrderList jobOrders={jobOrders} />
    </div>
  );
}
