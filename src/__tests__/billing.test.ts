import { calculateVat, calculateInvoiceTotal } from '../lib/costing-math';

export function runBillingTests() {
  console.log('Running billing tests...');

  const vatExclusive = calculateVat(15931.49, false);
  if (Math.abs(vatExclusive - 1911.78) > 0.01) {
    throw new Error(`Expected VAT 1911.78, got ${vatExclusive}`);
  }

  const vatInclusive = calculateVat(15931.49, true);
  const expectedInclusive = 15931.49 - 15931.49 / 1.12;
  if (Math.abs(vatInclusive - expectedInclusive) > 0.01) {
    throw new Error(`Expected inclusive VAT ${expectedInclusive}, got ${vatInclusive}`);
  }

  const total = calculateInvoiceTotal(15931.49, false);
  if (Math.abs(total - 17843.27) > 0.01) {
    throw new Error(`Expected invoice total 17843.27, got ${total}`);
  }

  console.log('✓ Billing tests passed.');
}
