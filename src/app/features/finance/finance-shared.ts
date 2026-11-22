export { formatTimestamp, normalizeDate, shortId, todayDate } from '../health/health-shared';

export function formatAmount(value: number | null | undefined, currency = 'XOF'): string {
  if (value === null || value === undefined) {
    return '-';
  }
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return `${rounded} ${currency}`;
}
