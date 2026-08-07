import { canDisburseBePaid } from '../lib/dcs';
import { hasPermission, ProjectRole } from '../lib/roles';

export function runDcsTests() {
  console.log('Running DCS disbursement tests...');

  // DCS can pay an APPROVED disbursement
  if (!canDisburseBePaid('APPROVED', 'ROLE_DCS')) {
    throw new Error('DCS should be able to pay an approved disbursement');
  }

  // DCS cannot pay a PENDING disbursement
  if (canDisburseBePaid('PENDING', 'ROLE_DCS')) {
    throw new Error('DCS should not be able to pay a pending disbursement');
  }

  // GM can approve a pending disbursement but not pay it
  if (canDisburseBePaid('PENDING', 'ROLE_GM')) {
    throw new Error('GM paying a pending disbursement should not be treated as DCS payment');
  }

  // DCS must never see GM-only approval permission
  if (hasPermission('ROLE_DCS', 'disburseApprove')) {
    throw new Error('DCS should not be allowed to approve disbursements');
  }

  if (!hasPermission('ROLE_DCS', 'disburseRecordPayment')) {
    throw new Error('DCS should be allowed to record payment');
  }

  console.log('✓ DCS tests passed.');
}
