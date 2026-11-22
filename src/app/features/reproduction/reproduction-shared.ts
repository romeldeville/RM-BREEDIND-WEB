import { Animal } from '../../core/api/herd.service';
import { ReproductionCycle } from '../../core/api/reproduction.service';

export function todayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function dateToInstant(value: string): string | null {
  const date = normalizeDate(value);
  return date ? `${date}T12:00:00Z` : null;
}

export function datetimeToInstant(value: string): string | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function normalizeDate(value: string): string | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').replace('Z', '');
}

export function animalLabel(animal: Animal): string {
  return animal.name ? `${animal.identifier} - ${animal.name}` : animal.identifier;
}

export function shortId(value: string): string {
  return value.length <= 8 ? value : value.slice(0, 8);
}

export function cycleLabel(cycle: ReproductionCycle, animals: Animal[]): string {
  const female = animals.find((animal) => animal.id === cycle.femaleId);
  return `${female ? animalLabel(female) : shortId(cycle.femaleId)} - ${cycle.status}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
