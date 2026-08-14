import { getDemoRole } from '@/lib/actor';
import { listJobOrders } from '@/lib/api';
import { canAccessModule } from '@/lib/roles';
import PageHeader from '@/components/PageHeader';
import JobOrderList from './JobOrderList';
import AccessDenied from '@/components/AccessDenied';

export default async function JobOrdersPage() {
  const role = await getDemoRole();
  if (!canAccessModule(role, 'jobOrders')) {
    return <AccessDenied role={role} requiredCapability="joChangeStatus" />;
  }
  const jobOrders = await listJobOrders(role);

  return (
    <div className="space-y-6">
      <PageHeader title="Job Orders" description="Track active and completed service job orders." />
      <JobOrderList jobOrders={jobOrders} />
    </div>
  );
}
