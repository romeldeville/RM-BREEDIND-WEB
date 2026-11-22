export { dateToInstant, formatTimestamp, normalizeDate, shortId, todayDate } from '../health/health-shared';

export function formatAmount(value: number | null | undefined, currency = 'XOF'): string {
  if (value === null || value === undefined) {
    return '-';
  }
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return `${rounded} ${currency}`;
}

export function paymentStatusLabel(status: string): string {
  switch (status) {
    case 'PAID':
      return 'Payée';
    case 'PARTIAL':
      return 'Partielle';
    default:
      return 'Impayée';
  }
}

export function saleStatusLabel(status: string): string {
  return status === 'CANCELLED' ? 'Annulée' : 'Confirmée';
}
