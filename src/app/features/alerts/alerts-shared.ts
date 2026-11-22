export { formatTimestamp, normalizeDate, todayDate } from '../health/health-shared';

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').replace('Z', '');
}

export function priorityLabel(priority: string): string {
  switch (priority) {
    case 'CRITICAL':
      return 'Critique';
    case 'IMPORTANT':
      return 'Importante';
    default:
      return 'Information';
  }
}

export function alertStatusLabel(status: string): string {
  switch (status) {
    case 'POSTPONED':
      return 'Reportée';
    case 'CLOSED':
      return 'Clôturée';
    case 'CANCELLED':
      return 'Annulée';
    default:
      return 'Ouverte';
  }
}

export function taskStatusLabel(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'Terminée';
    case 'CANCELLED':
      return 'Annulée';
    default:
      return 'Ouverte';
  }
}

export function isAlertOpen(status: string): boolean {
  return status === 'OPEN' || status === 'POSTPONED';
}
