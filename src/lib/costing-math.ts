export function calculateVat(amountCents: number, isVatInclusive: boolean): number {
  if (isVatInclusive) {
    return Math.floor((amountCents * 3 + 14) / 28);
  }
  return Math.floor((amountCents * 12 + 50) / 100);
}

export function calculateInvoiceTotal(subtotalCents: number, isVatInclusive: boolean): number {
  if (isVatInclusive) {
    return subtotalCents;
  }
  return subtotalCents + calculateVat(subtotalCents, false);
}

export function calculateAllocationRemainder(
  invoiceTotalCents: number,
  allocations: Array<{ amountCents: number }>
): number {
  const allocatedCents = allocations.reduce((sum, a) => sum + a.amountCents, 0);
  return invoiceTotalCents - allocatedCents;
}

export function calculateJobCosting(params: {
  billedCents: number;
  actualLaborCents: number;
  actualPartsCents: number;
  allocatedExpensesCents: number;
  isVatInclusive: boolean;
}) {
  const totalActualCostCents =
    params.actualLaborCents + params.actualPartsCents + params.allocatedExpensesCents;
  const netProfitCents = params.billedCents - totalActualCostCents;
  const profitMarginPercent =
    params.billedCents > 0 ? (netProfitCents / params.billedCents) * 100 : 0;
  const vatAmountCents = calculateVat(params.billedCents, params.isVatInclusive);

  return {
    totalActualCostCents,
    netProfitCents,
    profitMarginPercent,
    vatAmountCents,
  };
}
