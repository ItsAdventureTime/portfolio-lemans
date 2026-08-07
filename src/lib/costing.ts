import 'server-only';

import { db } from './db';
import {
  calculateVat,
  calculateInvoiceTotal,
  calculateAllocationRemainder,
  calculateJobCosting,
} from './costing-math';

export { calculateVat, calculateInvoiceTotal, calculateAllocationRemainder, calculateJobCosting };

export async function getJobOrderActuals(joId: string) {
  const allocations = await db.supplierInvoiceAllocation.findMany({
    where: { joId },
  });
  const partsCost = allocations.reduce((sum, a) => sum + a.amount, 0);
  return { partsCost };
}
