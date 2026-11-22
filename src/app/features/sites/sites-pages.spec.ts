import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Type } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  Building,
  Farm,
  Pen,
  PenOccupancy,
  ReferentialService,
} from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FarmPlanPage } from './farm-plan.page';
import { SitesPage } from './sites.page';

const FARM: Farm = {
  id: 'farm-1',
  tenantId: 'tenant-1',
  name: 'Ferme test',
  code: 'ferme-test',
  country: 'FR',
  currency: 'EUR',
  timezone: 'Europe/Paris',
};

const BUILDING: Building = {
  id: 'building-1',
  farmId: 'farm-1',
  name: 'Étable',
  code: 'et',
  type: 'LIVESTOCK',
  archivedAt: null,
};

const PEN: Pen = {
  id: 'pen-1',
  farmId: 'farm-1',
  buildingId: 'building-1',
  name: 'Loge A',
  code: 'A',
  type: 'GROUP',
  capacity: 10,
  archivedAt: null,
};

const OCCUPANCY: PenOccupancy = { penId: 'pen-1', capacity: 10, occupied: 7 };

const SERVICE_STUB = {
  farms: () => of([FARM]),
  buildings: () => of([BUILDING]),
  pens: () => of([PEN]),
  occupancy: () => of(OCCUPANCY),
};

async function render<T>(component: Type<T>) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ReferentialService, useValue: SERVICE_STUB },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('fr');
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('Sites web pages', () => {
  it('renders buildings and pens with occupancy', async () => {
    const fixture = await render(SitesPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Bâtiments et loges');
    expect(text).toContain('Étable');
    expect(text).toContain('Loge A');
    expect(text).toContain('7 / 10');
  });

  it('renders the farm plan', async () => {
    const fixture = await render(FarmPlanPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Plan de ferme');
    expect(text).toContain('Étable');
    expect(text).toContain('Loge A');
    expect(text).toContain('7 / 10');
  });
});
