import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Type } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Animal, AnimalStatusEntry, HerdService, Lot, LotMovement } from '../../core/api/herd.service';
import { Breed, Farm, ReferentialService, Species } from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { AnimalDetailPage } from './animal-detail.page';
import { AnimalFormPage } from './animal-form.page';
import { AnimalListPage } from './animal-list.page';
import { AnimalStatusPage } from './animal-status.page';
import { LotClosePage } from './lot-close.page';
import { LotDetailPage } from './lot-detail.page';
import { LotFormPage } from './lot-form.page';
import { LotListPage } from './lot-list.page';
import { LotMovementsPage } from './lot-movements.page';

const SPECIES: Species = {
  id: 'species-1',
  name: 'Bovin',
  code: 'bovin',
  productionType: 'MILK',
  trackingMode: 'INDIVIDUAL',
  gestationDays: 285,
  heatCycleDays: 21,
  weaningAgeDays: null,
  incubationDays: null,
  settings: {},
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const BREED: Breed = {
  id: 'breed-1',
  speciesId: 'species-1',
  name: 'Holstein',
  code: 'holstein',
  archivedAt: null,
};

const FARM: Farm = {
  id: 'farm-1',
  tenantId: 'tenant-1',
  name: 'Ferme test',
  code: 'ferme-test',
  country: 'FR',
  currency: 'EUR',
  timezone: 'Europe/Paris',
};

const ANIMAL: Animal = {
  id: 'animal-1',
  farmId: 'farm-1',
  speciesId: 'species-1',
  breedId: 'breed-1',
  penId: null,
  identifier: 'A-001',
  name: 'Bella',
  sex: 'FEMALE',
  birthDate: '2025-01-15',
  birthEstimated: false,
  origin: 'NAISSANCE',
  status: 'ACTIVE',
  motherId: 'animal-2',
  fatherId: null,
  photoKey: null,
  weightKg: 420,
  acquiredAt: null,
  archivedAt: null,
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-02T10:00:00Z',
  version: 1,
};

const MOTHER: Animal = {
  ...ANIMAL,
  id: 'animal-2',
  identifier: 'M-001',
  name: null,
  motherId: null,
};

const HISTORY: AnimalStatusEntry = {
  id: 'history-1',
  animalId: 'animal-1',
  status: 'ACTIVE',
  changedAt: '2026-01-01T10:00:00Z',
  reason: 'Initial status',
  actorId: null,
};

const LOT: Lot = {
  id: 'lot-1',
  farmId: 'farm-1',
  speciesId: 'species-1',
  name: 'Bandes 2026',
  code: 'B26',
  productionType: 'MEAT',
  status: 'OPEN',
  entryDate: '2026-02-01',
  initialCount: 10,
  currentCount: 7,
  origin: 'CREATED',
  unitCost: 12.5,
  closedAt: null,
  version: 1,
  createdAt: '2026-02-01T10:00:00Z',
  updatedAt: '2026-02-02T10:00:00Z',
};

const MOVEMENT: LotMovement = {
  id: 'movement-1',
  lotId: 'lot-1',
  type: 'ENTRY',
  quantity: 10,
  occurredAt: '2026-02-01T10:00:00Z',
  reason: 'Entrée initiale',
  actorId: null,
  createdAt: '2026-02-01T10:00:00Z',
};

const HERD_STUB = {
  animals: () => of({ items: [ANIMAL, MOTHER], nextCursor: null }),
  animal: () => of(ANIMAL),
  createAnimal: () => of(ANIMAL),
  patchAnimal: () => of(ANIMAL),
  changeStatus: () => of(HISTORY),
  statusHistory: () => of([HISTORY]),
  individualize: () => of(ANIMAL),
  lots: () => of({ items: [LOT], nextCursor: null }),
  lot: () => of(LOT),
  createLot: () => of(LOT),
  patchLot: () => of(LOT),
  lotMovements: () => of([MOVEMENT]),
  moveLot: () => of(MOVEMENT),
  closeLot: () =>
    of({
      lotId: 'lot-1',
      mortalityRate: 0.2,
      feedConversion: null,
      gmq: null,
      cost: 25,
      revenue: null,
      margin: null,
      closedAt: '2026-03-01T10:00:00Z',
    }),
  splitLot: () => of(LOT),
  mergeLot: () => of(LOT),
};

const REFERENTIAL_STUB = {
  species: () => of([SPECIES]),
  breeds: () => of([BREED]),
  farms: () => of([FARM]),
};

function routeWith(id: string | null) {
  return { snapshot: { paramMap: { get: () => id } } };
}

async function render<T>(component: Type<T>, id: string | null = null) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: routeWith(id) },
      { provide: HerdService, useValue: HERD_STUB },
      { provide: ReferentialService, useValue: REFERENTIAL_STUB },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('fr');
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('Herd web pages', () => {
  it('renders the animal list with filters', async () => {
    const fixture = await render(AnimalListPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Cheptel');
    expect(text).toContain('A-001');
    expect(text).toContain('Bella');
    expect(text).toContain('Nouvel animal');
    expect(text).toContain('Lots');
  });

  it('renders the animal detail with filiation', async () => {
    const fixture = await render(AnimalDetailPage, 'animal-1');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('A-001');
    expect(text).toContain('Bella');
    expect(text).toContain('Holstein');
    expect(text).toContain('Filiation');
    expect(text).toContain('animal-2');
  });

  it('renders the animal creation form', async () => {
    const fixture = await render(AnimalFormPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouvel animal');
    expect(text).toContain('Ferme test');
    expect(text).toContain('Bovin');
    expect(text).toContain('Enregistrer');
  });

  it('renders status and history', async () => {
    const fixture = await render(AnimalStatusPage, 'animal-1');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Statut et filiation');
    expect(text).toContain('Historique');
    expect(text).toContain('Initial status');
  });

  it('renders the lot list', async () => {
    const fixture = await render(LotListPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Bandes 2026');
    expect(text).toContain('7 / 10');
    expect(text).toContain('Nouveau lot');
  });

  it('renders the lot detail', async () => {
    const fixture = await render(LotDetailPage, 'lot-1');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Bandes 2026');
    expect(text).toContain('B26');
    expect(text).toContain('MEAT');
    expect(text).toContain('Mouvements');
    expect(text).toContain('Clôturer');
  });

  it('renders the lot creation form', async () => {
    const fixture = await render(LotFormPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouveau lot');
    expect(text).toContain('Effectif initial');
    expect(text).toContain('Enregistrer');
  });

  it('renders lot movements and history', async () => {
    const fixture = await render(LotMovementsPage, 'lot-1');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Mouvements du lot');
    expect(text).toContain('Ajouter un mouvement');
    expect(text).toContain('ENTRY');
    expect(text).toContain('Entrée initiale');
  });

  it('renders the lot closure with blocking message', async () => {
    const fixture = await render(LotClosePage, 'lot-1');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Clôture du lot');
    expect(text).toContain('Effectif actuel');
    expect(text).toContain("L'effectif doit être nul avant la clôture.");
    expect(text).toContain('Clôturer le lot');
  });
});
