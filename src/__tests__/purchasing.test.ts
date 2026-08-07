import { calculateAllocationRemainder } from '../lib/costing-math';

export function runPurchasingTests() {
  console.log('Running purchasing allocation tests...');

  const invoiceTotal = 1500.0;
  const allocations = [
    { joId: 'jo-1', amount: 500 },
    { joId: 'jo-2', amount: 500 },
    { joId: 'jo-3', amount: 500 },
  ];

  const remainder = calculateAllocationRemainder(invoiceTotal, allocations);
  if (Math.abs(remainder) > 0.01) {
    throw new Error(`Expected remainder 0, got ${remainder}`);
  }

  const overAllocations = [
    { joId: 'jo-1', amount: 800 },
    { joId: 'jo-2', amount: 800 },
  ];

  const over = calculateAllocationRemainder(invoiceTotal, overAllocations);
  if (Math.abs(over + 100.0) > 0.01) {
    throw new Error(`Expected over-allocation -100, got ${over}`);
  }

  console.log('✓ Purchasing allocation tests passed.');
}
