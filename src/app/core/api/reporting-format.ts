import { IndicatorValue } from './dashboard.models';

export const UNAVAILABLE = 'Indisponible';

const MONTH_LABELS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

export function monthLabel(month: number): string {
  return MONTH_LABELS[month - 1] ?? '';
}

/** Local date as YYYY-MM-DD (avoids the UTC shift of toISOString). */
export function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Mirrors the mobile formatting: integer values without decimals, otherwise 2 decimals. */
export function formatDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return UNAVAILABLE;
  }
  return value === Math.round(value) ? String(value) : value.toFixed(2);
}

export function formatIndicatorValue(indicator: IndicatorValue): string {
  const value = formatDecimal(indicator.value);
  if (value === UNAVAILABLE) {
    return value;
  }
  return indicator.unit ? `${value} ${indicator.unit}` : value;
}
