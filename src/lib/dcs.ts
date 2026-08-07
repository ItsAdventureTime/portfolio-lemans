import { DisbursementStatus } from '@prisma/client';
import { hasPermission, ProjectRole } from './roles';

export function canDisburseBePaid(status: DisbursementStatus, role: ProjectRole | string): boolean {
  return status === 'APPROVED' && hasPermission(role, 'disburseRecordPayment');
}
