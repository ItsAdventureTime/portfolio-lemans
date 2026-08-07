export type ProjectRole =
  'ROLE_SALES' | 'ROLE_SVC' | 'ROLE_PURCH' | 'ROLE_GM' | 'ROLE_DCS' | 'ROLE_ADMIN';

export const ROLES: Record<ProjectRole, string> = {
  ROLE_SALES: 'Sales',
  ROLE_SVC: 'Service Delivery',
  ROLE_PURCH: 'Purchasing',
  ROLE_GM: 'General Manager',
  ROLE_DCS: 'DCS / Treasury',
  ROLE_ADMIN: 'Administrator',
};

export const PERMISSIONS: Record<string, readonly ProjectRole[]> = {
  quoteApprove: ['ROLE_SALES', 'ROLE_GM', 'ROLE_ADMIN'],
  quoteConvert: ['ROLE_SALES', 'ROLE_SVC', 'ROLE_GM', 'ROLE_ADMIN'],
  joAssignTech: ['ROLE_SVC', 'ROLE_GM', 'ROLE_ADMIN'],
  joChangeStatus: ['ROLE_SVC', 'ROLE_GM', 'ROLE_ADMIN'],
  attachmentView: ['ROLE_SVC', 'ROLE_GM', 'ROLE_DCS', 'ROLE_ADMIN'],
  attachmentUpload: ['ROLE_SVC', 'ROLE_DCS', 'ROLE_ADMIN'],
  prCreate: ['ROLE_PURCH', 'ROLE_GM', 'ROLE_ADMIN'],
  prApprove: ['ROLE_GM', 'ROLE_ADMIN'],
  poCreate: ['ROLE_GM', 'ROLE_ADMIN'],
  supplierInvoiceCreate: ['ROLE_PURCH', 'ROLE_GM', 'ROLE_ADMIN'],
  supplierInvoiceAllocate: ['ROLE_PURCH', 'ROLE_GM', 'ROLE_ADMIN'],
  supplierInvoiceApprove: ['ROLE_GM', 'ROLE_ADMIN'],
  opexCreate: ['ROLE_SALES', 'ROLE_SVC', 'ROLE_PURCH', 'ROLE_GM', 'ROLE_ADMIN'],
  opexApprove: ['ROLE_GM', 'ROLE_ADMIN'],
  disburseApprove: ['ROLE_GM', 'ROLE_ADMIN'],
  disburseRecordPayment: ['ROLE_DCS', 'ROLE_ADMIN'],
  invoiceCreate: ['ROLE_SALES', 'ROLE_ADMIN'],
  invoiceRecordPayment: ['ROLE_SALES', 'ROLE_DCS', 'ROLE_ADMIN'],
  viewAccounting: ['ROLE_ADMIN'],
};

export function hasPermission(
  role: ProjectRole | string | undefined,
  action: keyof typeof PERMISSIONS
): boolean {
  if (!role) return false;
  const allowed = PERMISSIONS[action] ?? [];
  return allowed.includes(role as ProjectRole);
}

export function ensurePermission(
  role: ProjectRole | string | undefined,
  action: keyof typeof PERMISSIONS
): void {
  if (!hasPermission(role, action)) {
    throw new Error(`Forbidden: role ${role ?? 'unknown'} lacks permission ${action}`);
  }
}
