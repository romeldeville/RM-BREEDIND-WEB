import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Type } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Expense, FinanceService, LotCost, LotMargin, Revenue } from '../../core/api/finance.service';
import { HerdService, Lot } from '../../core/api/herd.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FinanceCostsPage } from './costs.page';
import { FinanceExpensePage } from './expense.page';
import { FinancePage } from './finance.page';
import { FinanceRevenuePage } from './revenue.page';

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

const EXPENSE: Expense = {
  id: 'expense-1',
  farmId: 'farm-1',
  category: 'VETERINARY',
  amount: 25000,
  currency: 'XOF',
  incurredAt: '2026-11-13',
  description: null,
  supplier: null,
};

const REVENUE: Revenue = {
  id: 'revenue-1',
  farmId: 'farm-1',
  category: 'MILK',
  amount: 80000,
  currency: 'XOF',
  receivedAt: '2026-11-13',
  description: null,
};

const COST: LotCost = {
  lotId: 'lot-1',
  feedCost: 100000,
  allocatedCost: 25000,
  totalCost: 125000,
};

const MARGIN: LotMargin = {
  lotId: 'lot-1',
  revenue: 200000,
  cost: 125000,
  margin: 75000,
  marginRate: 37.5,
};

const HERD_STUB = {
  lots: () => of({ items: [LOT], nextCursor: null }),
};

const FINANCE_STUB = {
  expenses: () => of([EXPENSE]),
  createExpense: () => of(EXPENSE),
  revenues: () => of([REVENUE]),
  createRevenue: () => of(REVENUE),
  lotCost: () => of(COST),
  lotMargin: () => of(MARGIN),
};

async function render<T>(component: Type<T>) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: HerdService, useValue: HERD_STUB },
      { provide: FinanceService, useValue: FINANCE_STUB },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('fr');
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('Finance web pages', () => {
  it('renders the finance hub and recent expenses', async () => {
    const fixture = await render(FinancePage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Finances');
    expect(text).toContain('Dépenses');
    expect(text).toContain('Revenus');
    expect(text).toContain('Coûts & marges');
    expect(text).toContain('25000 XOF');
  });

  it('renders the expense form', async () => {
    const fixture = await render(FinanceExpensePage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouvelle dépense');
    expect(text).toContain('Catégorie');
    expect(text).toContain('Fournisseur');
  });

  it('renders the revenue form', async () => {
    const fixture = await render(FinanceRevenuePage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouveau revenu');
    expect(text).toContain('Catégorie');
  });

  it('renders lot cost and margin', async () => {
    const fixture = await render(FinanceCostsPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Coût du lot');
    expect(text).toContain('Coût total');
    expect(text).toContain('125000 XOF');
    expect(text).toContain('Marge du lot');
    expect(text).toContain('Taux de marge');
  });
});
