const PESO_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPeso(cents: number): string {
  return PESO_FORMATTER.format(cents / 100);
}

export function parsePesoToCents(value: string): number | null {
  const normalized = value.trim();
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(normalized)) return null;

  const [whole = '0', fraction = ''] = normalized.split('.');
  const cents = Number(whole || 0) * 100 + Number(fraction.padEnd(2, '0') || 0);
  return Number.isSafeInteger(cents) ? cents : null;
}

/** @deprecated Prefer parsePesoToCents for user-entered peso strings. */
export function formatPesoAmount(amount: number): string {
  return formatPeso(pesoToCents(amount));
}

export function pesoToCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return parsePesoToCents(amount.toFixed(2)) ?? 0;
}

export function centsToPeso(cents: number): number {
  return cents / 100;
}
