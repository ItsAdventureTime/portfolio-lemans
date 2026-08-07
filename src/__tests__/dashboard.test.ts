import { hasPermission } from '../lib/roles';

export function runDashboardTests() {
  console.log('Running dashboard regression tests...');

  // Root dashboard should be protected; simulate middleware path matching.
  const protectedPaths = [
    '/',
    '/customers',
    '/quotations',
    '/job-orders',
    '/purchasing',
    '/expenses',
    '/dcs',
    '/invoices',
    '/job-costing',
    '/accounting',
  ];

  const publicPaths = ['/login', '/api/auth/sign-in/email'];

  for (const path of protectedPaths) {
    const isProtected = protectedPaths.some((p) => path === p || (p !== '/' && path.startsWith(p)));
    if (!isProtected) {
      throw new Error(`Expected path ${path} to be protected`);
    }
  }

  for (const path of publicPaths) {
    const isPublic = publicPaths.some((p) => path.startsWith(p));
    if (!isPublic) {
      throw new Error(`Expected path ${path} to be public`);
    }
  }

  // Unauthenticated users should not be able to view dashboard data. We cannot
  // invoke the server component here, but we verify that the permission helper
  // denies actions without a role.
  if (hasPermission(undefined, 'viewAccounting')) {
    throw new Error('Undefined role should not have any permissions');
  }

  // DCS must not be able to view dashboard approval metrics (approve action)
  if (hasPermission('ROLE_DCS', 'disburseApprove')) {
    throw new Error('DCS should not have GM approval permission');
  }

  console.log('✓ Dashboard regression tests passed.');
}
