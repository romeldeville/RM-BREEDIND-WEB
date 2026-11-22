import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Type } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Animal, HerdService, Lot } from '../../core/api/herd.service';
import {
  Feed,
  FeedDistribution,
  FeedReceipt,
  FeedingPlan,
  FeedingService,
  FeedStock,
  LowStockAlert,
} from '../../core/api/feeding.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FeedingDistributionPage } from './distribution.page';
import { FeedingPage } from './feeding.page';
import { FeedingFeedsPage } from './feeds.page';
import { FeedingPlansPage } from './plans.page';
import { FeedingReceiptPage } from './receipt.page';
import { FeedingStockPage } from './stock.page';

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

const FEED: Feed = {
  id: 'feed-1',
  name: 'Maïs',
  type: 'CONCENTRATE',
  unit: 'kg',
  price: 0.35,
  supplier: 'Sarl',
  archivedAt: null,
};

const RECEIPT: FeedReceipt = {
  id: 'receipt-1',
  feedId: 'feed-1',
  quantity: 100,
  unitPrice: 0.4,
  receivedAt: '2026-11-13T08:00:00Z',
  supplier: 'Sarl',
  expiryDate: null,
  notes: null,
};

const DISTRIBUTION: FeedDistribution = {
  id: 'distribution-1',
  feedId: 'feed-1',
  lotId: 'lot-1',
  animalId: null,
  quantity: 20,
  distributedAt: '2026-11-13T09:00:00Z',
  actorId: null,
  planId: null,
  notes: null,
};

const STOCK: FeedStock = {
  feedId: 'feed-1',
  feedName: 'Maïs',
  unit: 'kg',
  quantity: 42,
  averagePrice: 0.35,
  updatedAt: '2026-11-13T09:00:00Z',
};

const ALERT: LowStockAlert = {
  feedId: 'feed-1',
  feedName: 'Maïs',
  unit: 'kg',
  quantity: 8,
  threshold: 10,
};

const PLAN: FeedingPlan = {
  id: 'plan-1',
  speciesId: 'species-1',
  name: 'Poussin démarrage',
  stages: [{ name: 'Démarrage', days: 14 }],
  active: true,
};

const HERD_STUB = {
  animals: () => of({ items: [ANIMAL], nextCursor: null }),
  lots: () => of({ items: [LOT], nextCursor: null }),
};

const FEEDING_STUB = {
  feeds: () => of([FEED]),
  createFeed: () => of(FEED),
  receipts: () => of([RECEIPT]),
  receiveFeed: () => of(RECEIPT),
  distributions: () => of([DISTRIBUTION]),
  distribute: () => of(DISTRIBUTION),
  stocks: () => of([STOCK]),
  lowStock: () => of([ALERT]),
  feedingPlans: () => of([PLAN]),
  costs: () => of([]),
  computeCost: () => of({ id: 'cost-1', lotId: 'lot-1', animalId: null, amount: 7, periodStart: null, periodEnd: null }),
};

async function render<T>(component: Type<T>) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: HerdService, useValue: HERD_STUB },
      { provide: FeedingService, useValue: FEEDING_STUB },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('fr');
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('Feeding web pages', () => {
  it('renders the feeding hub and low stock alerts', async () => {
    const fixture = await render(FeedingPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Alimentation');
    expect(text).toContain('Aliments');
    expect(text).toContain('Distribution');
    expect(text).toContain('Stocks bas');
    expect(text).toContain('Maïs');
  });

  it('renders the feeds list and form', async () => {
    const fixture = await render(FeedingFeedsPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Aliments');
    expect(text).toContain('Nouvel aliment');
    expect(text).toContain('Maïs');
    expect(text).toContain('Créer l’aliment');
  });

  it('renders the receipt form and history', async () => {
    const fixture = await render(FeedingReceiptPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouvelle réception');
    expect(text).toContain('Réceptions récentes');
    expect(text).toContain('Sarl');
  });

  it('renders the distribution form and history', async () => {
    const fixture = await render(FeedingDistributionPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouvelle distribution');
    expect(text).toContain('Distributions récentes');
    expect(text).toContain('Lot lot-1');
  });

  it('renders the stock page and alerts', async () => {
    const fixture = await render(FeedingStockPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Seuil de stock bas');
    expect(text).toContain('Stocks');
    expect(text).toContain('Alertes de stock bas');
  });

  it('renders the feeding plans list', async () => {
    const fixture = await render(FeedingPlansPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Plans d’alimentation');
    expect(text).toContain('Poussin démarrage');
    expect(text).toContain('Actif');
  });
});
