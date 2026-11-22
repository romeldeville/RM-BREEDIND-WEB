export { dateToInstant, formatTimestamp, normalizeDate, shortId, todayDate } from '../health/health-shared';

export function formatQuantity(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }
  return Number.isInteger(value) ? value.toString() : value.toString();
}
