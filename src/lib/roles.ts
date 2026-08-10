export const ROLES = {
  ROLE_ADMIN: 'Admin',
  ROLE_GM: 'General Manager',
  ROLE_SALES: 'Sales Advisor',
  ROLE_SVC: 'Service Advisor',
  ROLE_PURCH: 'Purchasing',
  ROLE_DCS: 'DCS',
} as const;

export type ProjectRole = keyof typeof ROLES;

export const ROLE_ORDER: ProjectRole[] = [
  'ROLE_ADMIN',
  'ROLE_GM',
  'ROLE_SALES',
  'ROLE_SVC',
  'ROLE_PURCH',
  'ROLE_DCS',
];

export function isValidRole(role: string): role is ProjectRole {
  return role in ROLES;
}

export function defaultRole(): ProjectRole {
  return 'ROLE_ADMIN';
}

export function parseRole(role: string | undefined): ProjectRole {
  if (role && isValidRole(role)) return role;
  return defaultRole();
}

const PERMISSIONS: Record<string, ProjectRole[]> = {
  customerCreate: ['ROLE_ADMIN', 'ROLE_SALES', 'ROLE_SVC'],
  quoteApprove: ['ROLE_ADMIN', 'ROLE_SALES', 'ROLE_GM'],
  quoteConvert: ['ROLE_ADMIN', 'ROLE_SALES', 'ROLE_SVC', 'ROLE_GM'],
  salesQuotationCreate: ['ROLE_ADMIN', 'ROLE_SALES', 'ROLE_SVC', 'ROLE_GM'],
  joAssignTech: ['ROLE_ADMIN', 'ROLE_SVC', 'ROLE_GM'],
  joChangeStatus: ['ROLE_ADMIN', 'ROLE_SVC', 'ROLE_GM'],
  attachmentView: ['ROLE_ADMIN', 'ROLE_SVC', 'ROLE_GM', 'ROLE_DCS'],
  attachmentUpload: ['ROLE_ADMIN', 'ROLE_SVC', 'ROLE_DCS'],
  prCreate: ['ROLE_ADMIN', 'ROLE_PURCH', 'ROLE_GM'],
  prApprove: ['ROLE_ADMIN', 'ROLE_GM'],
  poCreate: ['ROLE_ADMIN', 'ROLE_GM'],
  supplierInvoiceCreate: ['ROLE_ADMIN', 'ROLE_PURCH', 'ROLE_GM'],
  supplierInvoiceAllocate: ['ROLE_ADMIN', 'ROLE_PURCH', 'ROLE_GM'],
  supplierInvoiceApprove: ['ROLE_ADMIN', 'ROLE_GM'],
  opexCreate: ['ROLE_ADMIN', 'ROLE_SALES', 'ROLE_SVC', 'ROLE_PURCH', 'ROLE_GM'],
  opexApprove: ['ROLE_ADMIN', 'ROLE_GM'],
  disburseApprove: ['ROLE_ADMIN', 'ROLE_GM'],
  disburseRecordPayment: ['ROLE_ADMIN', 'ROLE_DCS'],
  invoiceCreate: ['ROLE_ADMIN', 'ROLE_SALES'],
  invoiceRecordPayment: ['ROLE_ADMIN', 'ROLE_SALES', 'ROLE_DCS'],
  viewAccounting: ['ROLE_ADMIN'],
  viewJobCosting: ['ROLE_ADMIN', 'ROLE_GM'],
};

export function hasPermission(role: ProjectRole, action: keyof typeof PERMISSIONS): boolean {
  const allowed = PERMISSIONS[action] ?? [];
  return allowed.includes(role);
}

export function ensurePermission(role: ProjectRole, action: keyof typeof PERMISSIONS): void {
  if (!hasPermission(role, action)) {
    throw new Error(`Forbidden: role ${role} lacks permission ${action}`);
  }
}
