const PESO_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPeso(cents: number): string {
  return PESO_FORMATTER.format(cents / 100);
}

export function formatPesoAmount(amount: number): string {
  return PESO_FORMATTER.format(amount);
}

export function pesoToCents(amount: number): number {
  return Math.round(amount * 100);
}

export function centsToPeso(cents: number): number {
  return cents / 100;
}
