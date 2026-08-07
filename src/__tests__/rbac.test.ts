import { hasPermission, ProjectRole } from '../lib/roles';

export function runRbacTests() {
  console.log('Running RBAC tests...');

  // DCS cannot approve purchase requests
  if (hasPermission('ROLE_DCS', 'prApprove')) {
    throw new Error('DCS should not be allowed to approve PRs');
  }

  // DCS cannot approve disbursements (only record payment after GM approval)
  if (hasPermission('ROLE_DCS', 'disburseApprove')) {
    throw new Error('DCS should not be allowed to approve disbursements');
  }

  // GM can approve PRs and OPEX
  if (!hasPermission('ROLE_GM', 'prApprove')) {
    throw new Error('GM should be allowed to approve PRs');
  }
  if (!hasPermission('ROLE_GM', 'opexApprove')) {
    throw new Error('GM should be allowed to approve OPEX');
  }

  // Admin can access accounting
  if (!hasPermission('ROLE_ADMIN', 'viewAccounting')) {
    throw new Error('Admin should be allowed to view accounting');
  }

  // Sales cannot view accounting
  if (hasPermission('ROLE_SALES', 'viewAccounting')) {
    throw new Error('Sales should not be allowed to view accounting');
  }

  // DCS can record payment
  if (!hasPermission('ROLE_DCS', 'disburseRecordPayment')) {
    throw new Error('DCS should be allowed to record payment');
  }

  console.log('✓ RBAC tests passed.');
}
