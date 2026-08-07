export function calculateVat(amount: number, isVatInclusive: boolean): number {
  if (isVatInclusive) {
    return amount - amount / 1.12;
  }
  return amount * 0.12;
}

export function calculateInvoiceTotal(subtotal: number, isVatInclusive: boolean): number {
  if (isVatInclusive) {
    return subtotal;
  }
  return subtotal + calculateVat(subtotal, false);
}

export function calculateAllocationRemainder(
  invoiceTotal: number,
  allocations: Array<{ amount: number }>
): number {
  const allocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  return invoiceTotal - allocated;
}

export function calculateJobCosting(params: {
  billedAmount: number;
  actualLaborCost: number;
  actualPartsCost: number;
  allocatedExpenses: number;
  isVatInclusive: boolean;
}) {
  const totalActualCost =
    params.actualLaborCost + params.actualPartsCost + params.allocatedExpenses;
  const netProfit = params.billedAmount - totalActualCost;
  const profitMarginPercent = params.billedAmount > 0 ? (netProfit / params.billedAmount) * 100 : 0;
  const vatAmount = calculateVat(params.billedAmount, params.isVatInclusive);

  return {
    totalActualCost,
    netProfit,
    profitMarginPercent,
    vatAmount,
  };
}
