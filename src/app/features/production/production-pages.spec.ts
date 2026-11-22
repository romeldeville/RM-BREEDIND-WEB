import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Type } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Animal, HerdService, Lot } from '../../core/api/herd.service';
import {
  EggCollection,
  EggMovement,
  EggStock,
  Gmq,
  GrowthCurve,
  ProductionService,
  Weighing,
} from '../../core/api/production.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ProductionCollectionPage } from './collection.page';
import { ProductionEggStockPage } from './egg-stock.page';
import { ProductionGrowthPage } from './growth.page';
import { ProductionPage } from './production.page';
import { ProductionWeighingPage } from './weighing.page';

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

const WEIGHING: Weighing = {
  id: 'weighing-1',
  animalId: 'animal-1',
  lotId: null,
  weighedAt: '2026-11-13T08:00:00Z',
  weightKg: 42.5,
  sampleCount: null,
  averageWeight: null,
};

const GMQ: Gmq = {
  animalId: 'animal-1',
  lotId: null,
  from: '2026-11-01T08:00:00Z',
  to: '2026-11-11T08:00:00Z',
  days: 10,
  startWeightKg: 30,
  endWeightKg: 40,
  gmq: 1,
};

const CURVE: GrowthCurve = {
  animalId: 'animal-1',
  lotId: null,
  speciesId: 'species-1',
  points: [{ weighedAt: '2026-11-13T08:00:00Z', weightKg: 42.5, ageDays: 120 }],
  reference: [{ ageDays: 120, weightKg: 40 }],
};

const COLLECTION: EggCollection = {
  id: 'collection-1',
  farmId: 'farm-1',
  lotId: 'lot-1',
  collectedAt: '2026-11-13T06:00:00Z',
  collected: 100,
  broken: 5,
  downgraded: 3,
  sellable: 92,
};

const MOVEMENT: EggMovement = {
  id: 'movement-1',
  farmId: 'farm-1',
  lotId: 'lot-1',
  type: 'SALE',
  quantity: 20,
  occurredAt: '2026-11-13T09:00:00Z',
  reason: null,
};

const STOCK: EggStock = {
  farmId: 'farm-1',
  lotId: 'lot-1',
  quantity: 72,
  updatedAt: '2026-11-13T09:00:00Z',
};

const HERD_STUB = {
  animals: () => of({ items: [ANIMAL], nextCursor: null }),
  lots: () => of({ items: [LOT], nextCursor: null }),
};

const PRODUCTION_STUB = {
  weighings: () => of([WEIGHING]),
  createWeighing: () => of(WEIGHING),
  gmq: () => of(GMQ),
  growthCurve: () => of(CURVE),
  collections: () => of([COLLECTION]),
  createCollection: () => of(COLLECTION),
  movements: () => of([MOVEMENT]),
  createMovement: () => of(MOVEMENT),
  eggStocks: () => of([STOCK]),
  layingRate: () => of({ lotId: 'lot-1', from: '', to: '', days: 10, henCount: 10, totalCollected: 200, layingRate: 20 }),
};

async function render<T>(component: Type<T>) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: HerdService, useValue: HERD_STUB },
      { provide: ProductionService, useValue: PRODUCTION_STUB },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('fr');
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('Production web pages', () => {
  it('renders the production hub and egg stock', async () => {
    const fixture = await render(ProductionPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Production');
    expect(text).toContain('Pesées');
    expect(text).toContain('Croissance');
    expect(text).toContain('Ramassage');
    expect(text).toContain('Stock d’œufs');
    expect(text).toContain('72 œufs');
  });

  it('renders the weighing form and history', async () => {
    const fixture = await render(ProductionWeighingPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouvelle pesée');
    expect(text).toContain('Pesées récentes');
    expect(text).toContain('42.5 kg');
  });

  it('renders the growth page with GMQ and points', async () => {
    const fixture = await render(ProductionGrowthPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Gain moyen quotidien');
    expect(text).toContain('1 kg/jour');
    expect(text).toContain('Points de croissance');
  });

  it('renders the collection form and history', async () => {
    const fixture = await render(ProductionCollectionPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouveau ramassage');
    expect(text).toContain('Œufs collectés');
    expect(text).toContain('Ramassages récents');
  });

  it('renders the egg stock page and movements', async () => {
    const fixture = await render(ProductionEggStockPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Stock d’œufs');
    expect(text).toContain('72 œufs');
    expect(text).toContain('Nouveau mouvement');
    expect(text).toContain('Mouvements récents');
  });
});
