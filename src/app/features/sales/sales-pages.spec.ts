import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Type } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Animal, HerdService, Lot } from '../../core/api/herd.service';
import { Customer, Payment, Sale, SalesService } from '../../core/api/sales.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SalesClientsPage } from './clients.page';
import { SalesPaymentsPage } from './payments.page';
import { SaleFormPage } from './sale-form.page';
import { SalesPage } from './sales.page';

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

const CUSTOMER: Customer = {
  id: 'customer-1',
  farmId: 'farm-1',
  name: 'Kouassi',
  phone: '0700',
  email: null,
  address: null,
  balance: 0,
  archivedAt: null,
};

const SALE: Sale = {
  id: 'sale-1',
  farmId: 'farm-1',
  customerId: 'customer-1',
  number: 'S-00001',
  type: 'ANIMAL',
  status: 'CONFIRMED',
  soldAt: '2026-11-13T10:00:00Z',
  totalAmount: 150000,
  currency: 'XOF',
  paymentStatus: 'UNPAID',
  notes: null,
  cancellationDeadline: null,
  lines: [],
};

const PAYMENT: Payment = {
  id: 'payment-1',
  saleId: 'sale-1',
  amount: 50000,
  method: 'CASH',
  status: 'COMPLETED',
  paidAt: '2026-11-13T11:00:00Z',
  reference: null,
};

const HERD_STUB = {
  animals: () => of({ items: [ANIMAL], nextCursor: null }),
  lots: () => of({ items: [LOT], nextCursor: null }),
};

const SALES_STUB = {
  customers: () => of([CUSTOMER]),
  createCustomer: () => of(CUSTOMER),
  sales: () => of([SALE]),
  sale: () => of(SALE),
  createSale: () => of(SALE),
  cancelSale: () => of(SALE),
  payments: () => of([PAYMENT]),
  addPayment: () => of(PAYMENT),
};

async function render<T>(component: Type<T>) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: HerdService, useValue: HERD_STUB },
      { provide: SalesService, useValue: SALES_STUB },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('fr');
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('Sales web pages', () => {
  it('renders the sales hub and recent sales', async () => {
    const fixture = await render(SalesPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ventes');
    expect(text).toContain('Nouvelle vente');
    expect(text).toContain('Paiements');
    expect(text).toContain('Clients');
    expect(text).toContain('S-00001');
    expect(text).toContain('150000 XOF');
  });

  it('renders the sale form', async () => {
    const fixture = await render(SaleFormPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouvelle vente');
    expect(text).toContain('Type');
    expect(text).toContain('Prix unitaire');
  });

  it('renders the payments page and payments', async () => {
    const fixture = await render(SalesPaymentsPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouveau paiement');
    expect(text).toContain('Paiements enregistrés');
    expect(text).toContain('50000 XOF');
  });

  it('renders the clients page and customers', async () => {
    const fixture = await render(SalesClientsPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouveau client');
    expect(text).toContain('Kouassi');
  });
});
