import { calculateJobCosting, calculateVat } from '../lib/costing-math';

export function runJobOrderTests() {
  console.log('Running Job Order costing tests...');

  const result = calculateJobCosting({
    billedAmount: 15931.49,
    actualLaborCost: 2100.0,
    actualPartsCost: 9850.0,
    allocatedExpenses: 0.0,
    isVatInclusive: false,
  });

  if (Math.abs(result.totalActualCost - 11950.0) > 0.01) {
    throw new Error(`Expected totalActualCost 11950.00, got ${result.totalActualCost}`);
  }
  if (Math.abs(result.netProfit - 3981.49) > 0.01) {
    throw new Error(`Expected netProfit 3981.49, got ${result.netProfit}`);
  }
  if (Math.abs(result.profitMarginPercent - 25.0) > 0.1) {
    throw new Error(`Expected profitMargin 25.0%, got ${result.profitMarginPercent}`);
  }

  const vat = calculateVat(15931.49, false);
  if (Math.abs(vat - 1911.78) > 0.1) {
    throw new Error(`Expected VAT 1911.78, got ${vat}`);
  }

  console.log('✓ Job Order costing tests passed.');
}
