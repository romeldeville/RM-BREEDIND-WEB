import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ApiClient } from '../../core/api/api-client';
import { Plan, Subscription, SubscriptionPage } from './subscription.page';

const PLANS: Plan[] = [
  {
    id: 'plan-starter',
    code: 'STARTER',
    name: 'Formule Démarrage',
    priceCents: 1500000,
    currency: 'XOF',
    interval: 'MONTHLY',
    trialDays: 14,
    quotas: { maxAnimals: 50 },
  },
  {
    id: 'plan-pro',
    code: 'PRO',
    name: 'Formule Professionnelle',
    priceCents: 3500000,
    currency: 'XOF',
    interval: 'MONTHLY',
    trialDays: 0,
    quotas: { maxAnimals: 500 },
  },
];

const SUBSCRIPTION: Subscription = {
  id: 'sub-1',
  planCode: 'PRO',
  planName: 'Formule Professionnelle',
  status: 'ACTIVE',
  currentPeriodEnd: '2026-12-31T23:59:59Z',
  trialEndsAt: undefined,
  isTrialActive: false,
};

describe('SubscriptionPage', () => {
  it('renders the subscription details and available plans', async () => {
    const apiStub = {
      get: (path: string) => {
        if (path === 'billing/plans') return of(PLANS);
        if (path === 'billing/subscription') return of(SUBSCRIPTION);
        return of(null);
      },
      post: () => of({ portalUrl: 'https://billing.stripe.com/test' }),
    };

    await TestBed.configureTestingModule({
      imports: [SubscriptionPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ApiClient, useValue: apiStub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SubscriptionPage);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Abonnement et Forfaits');
    expect(text).toContain('Formule Professionnelle (PRO)');
    expect(text).toContain('Statut : ACTIVE');
    expect(text).toContain('Formule Démarrage');
    expect(text).toContain('Gérer la facturation (Stripe)');
  });
});
