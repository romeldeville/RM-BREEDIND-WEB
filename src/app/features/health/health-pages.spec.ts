import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Type } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Animal, HerdService, Lot } from '../../core/api/herd.service';
import {
  HealthProduct,
  HealthService,
  Mortality,
  Quarantine,
  Treatment,
  Vaccination,
  Withdrawal,
} from '../../core/api/health.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { HealthPage } from './health.page';
import { HealthMortalityPage } from './mortality.page';
import { HealthProductsPage } from './products.page';
import { HealthQuarantinePage } from './quarantine.page';
import { HealthTreatmentPage } from './treatment.page';
import { HealthVaccinationPage } from './vaccination.page';
import { HealthWithdrawalsPage } from './withdrawals.page';

const ANIMAL: Animal = {
  id: 'animal-1',
  farmId: 'farm-1',
  speciesId: 'species-1',
  breedId: null,
  penId: null,
  identifier: 'A-001',
  name: 'Bella',
  sex: 'FEMALE',
  birthDate: '2024-01-15',
  birthEstimated: false,
  origin: 'NAISSANCE',
  status: 'ACTIVE',
  motherId: null,
  fatherId: null,
  photoKey: null,
  weightKg: 420,
  acquiredAt: null,
  archivedAt: null,
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-02T10:00:00Z',
  version: 1,
};

const LOT: Lot = {
  id: 'lot-1',
  farmId: 'farm-1',
  speciesId: 'species-1',
  name: 'Bande 1',
  code: null,
  productionType: null,
  status: 'OPEN',
  entryDate: '2026-01-01',
  initialCount: 10,
  currentCount: 10,
  origin: null,
  unitCost: null,
  closedAt: null,
  version: 1,
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z',
};

const PRODUCT: HealthProduct = {
  id: 'product-1',
  name: 'Vaccin PPR',
  type: 'VACCINE',
  speciesAllowed: null,
  dose: null,
  route: null,
  withdrawalMeatDays: 7,
  withdrawalEggsDays: 0,
  withdrawalMilkDays: 3,
  shelfLifeDays: null,
  supplier: null,
  stockQty: 12,
  archivedAt: null,
};

const VACCINATION: Vaccination = {
  id: 'vaccination-1',
  animalId: 'animal-1',
  lotId: null,
  productId: 'product-1',
  planId: null,
  vaccineLot: 'LOT-2026',
  dose: null,
  route: null,
  count: 1,
  performedAt: '2026-11-13T10:00:00Z',
  vetId: null,
  notes: null,
};

const TREATMENT: Treatment = {
  id: 'treatment-1',
  animalId: 'animal-1',
  lotId: null,
  productId: 'product-1',
  diagnosis: 'Mammite',
  symptoms: null,
  dose: null,
  route: null,
  startDate: '2026-11-10',
  durationDays: 5,
  endDate: null,
  status: 'ACTIVE',
  notes: null,
  withdrawalEndDate: '2026-11-18',
  administrations: [],
};

const WITHDRAWAL: Withdrawal = {
  id: 'withdrawal-1',
  treatmentId: 'treatment-1',
  animalId: 'animal-1',
  lotId: null,
  type: 'MEAT',
  startDate: '2026-11-10',
  endDate: '2026-11-18',
  status: 'ACTIVE',
};

const MORTALITY: Mortality = {
  id: 'mortality-1',
  animalId: 'animal-1',
  lotId: null,
  count: 1,
  cause: 'Maladie',
  occurredAt: '2026-11-12T10:00:00Z',
  actorId: null,
};

const QUARANTINE: Quarantine = {
  id: 'quarantine-1',
  animalId: 'animal-1',
  lotId: null,
  startDate: '2026-11-01',
  endDate: '2026-11-15',
  reason: 'Suspicion',
  status: 'ACTIVE',
  releasedBy: null,
};

const HERD_STUB = {
  animals: () => of({ items: [ANIMAL], nextCursor: null }),
  lots: () => of({ items: [LOT], nextCursor: null }),
};

const HEALTH_STUB = {
  products: () => of([PRODUCT]),
  createProduct: () => of(PRODUCT),
  vaccinations: () => of([VACCINATION]),
  recordVaccination: () => of(VACCINATION),
  treatments: () => of([TREATMENT]),
  createTreatment: () => of(TREATMENT),
  addAdministration: () => of({ id: 'admin-1', treatmentId: 'treatment-1', administeredAt: '', dose: null, actorId: null }),
  withdrawals: () => of([WITHDRAWAL]),
  saleEligibility: () => of({ allowed: false, blockingWithdrawals: [WITHDRAWAL] }),
  mortalities: () => of([MORTALITY]),
  recordMortality: () => of(MORTALITY),
  quarantines: () => of([QUARANTINE]),
  createQuarantine: () => of(QUARANTINE),
  releaseQuarantine: () => of({ ...QUARANTINE, status: 'RELEASED' }),
};

async function render<T>(component: Type<T>) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: HerdService, useValue: HERD_STUB },
      { provide: HealthService, useValue: HEALTH_STUB },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('fr');
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('Health web pages', () => {
  it('renders the health hub', async () => {
    const fixture = await render(HealthPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Santé');
    expect(text).toContain('Produits');
    expect(text).toContain('Vaccination');
    expect(text).toContain('Quarantaine');
  });

  it('renders the products list and form', async () => {
    const fixture = await render(HealthProductsPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Produits vétérinaires');
    expect(text).toContain('Nouveau produit');
    expect(text).toContain('Vaccin PPR');
    expect(text).toContain('Créer le produit');
  });

  it('renders the vaccination form', async () => {
    const fixture = await render(HealthVaccinationPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouvelle vaccination');
    expect(text).toContain('A-001 - Bella');
    expect(text).toContain('N° de lot du vaccin');
    expect(text).toContain('Vaccinations récentes');
  });

  it('renders the treatment form and list', async () => {
    const fixture = await render(HealthTreatmentPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouveau traitement');
    expect(text).toContain('Diagnostic');
    expect(text).toContain('Mammite');
    expect(text).toContain('Administrer');
  });

  it('renders the withdrawals page and eligibility check', async () => {
    const fixture = await render(HealthWithdrawalsPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Délais d’attente');
    expect(text).toContain('MEAT');
    expect(text).toContain('Vérification vente');
  });

  it('renders the mortality form', async () => {
    const fixture = await render(HealthMortalityPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouvelle mortalité');
    expect(text).toContain('Mortalités récentes');
    expect(text).toContain('Maladie');
  });

  it('renders the quarantine form and list', async () => {
    const fixture = await render(HealthQuarantinePage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouvelle quarantaine');
    expect(text).toContain('Quarantaines');
    expect(text).toContain('Libérer');
  });
});
