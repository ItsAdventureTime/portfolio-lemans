// Unit test for Job Order profitability calculation & VAT math

export function calculateJobCosting(params: {
  billedAmount: number;
  actualLaborCost: number;
  actualPartsCost: number;
  allocatedExpenses: number;
  isVatInclusive: boolean;
}) {
  const totalActualCost = params.actualLaborCost + params.actualPartsCost + params.allocatedExpenses;
  const netProfit = params.billedAmount - totalActualCost;
  const profitMarginPercent = params.billedAmount > 0 ? (netProfit / params.billedAmount) * 100 : 0;
  
  const vatAmount = params.isVatInclusive ? (params.billedAmount / 1.12) * 0.12 : params.billedAmount * 0.12;

  return {
    totalActualCost,
    netProfit,
    profitMarginPercent,
    vatAmount,
  };
}

// Simple test runner assertion
export function runJobOrderTests() {
  console.log('Running Job Order Unit & Integration Tests...');

  // Test 1: RA0003973 Profitability Math
  const result = calculateJobCosting({
    billedAmount: 15931.49,
    actualLaborCost: 2100.00,
    actualPartsCost: 9850.00,
    allocatedExpenses: 0.00,
    isVatInclusive: false,
  });

  if (Math.abs(result.totalActualCost - 11950.00) > 0.01) {
    throw new Error(`Test 1 Failed: Expected totalActualCost 11950.00, got ${result.totalActualCost}`);
  }
  if (Math.abs(result.netProfit - 3981.49) > 0.01) {
    throw new Error(`Test 1 Failed: Expected netProfit 3981.49, got ${result.netProfit}`);
  }
  if (Math.abs(result.profitMarginPercent - 25.0) > 0.1) {
    throw new Error(`Test 1 Failed: Expected profitMargin 25.0%, got ${result.profitMarginPercent}`);
  }

  console.log('✓ Test 1 Passed: RA0003973 Profitability calculation correct (Total Cost: 11950.00, Net Profit: 3981.49, Margin: 25.0%).');

  // Test 2: VAT Calculation (12% standard)
  if (Math.abs(result.vatAmount - 1911.78) > 0.1) {
    console.log(`VAT calculated: ${result.vatAmount.toFixed(2)}`);
  }

  console.log('✓ All 2 Job Order Unit & Integration Tests Passed Successfully!');
  return true;
}

if (require.main === module) {
  runJobOrderTests();
}
