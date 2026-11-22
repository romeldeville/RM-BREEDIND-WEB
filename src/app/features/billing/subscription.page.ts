import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiClient } from '../../core/api/api-client';

export interface Plan {
  id: string;
  code: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: string;
  trialDays: number;
  quotas: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  planCode: string;
  planName: string;
  status: string;
  currentPeriodEnd?: string;
  trialEndsAt?: string;
  isTrialActive: boolean;
}

@Component({
  selector: 'app-subscription-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="subscription-page p-6 max-w-6xl mx-auto">
      <header class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Abonnement et Forfaits</h1>
        <p class="text-sm text-gray-600">Gérez votre abonnement, vos quotas d'élevage et vos moyens de paiement</p>
      </header>

      @if (subscription(); as sub) {
        <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-5 mb-8 flex justify-between items-center">
          <div>
            <span class="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Abonnement actif</span>
            <h2 class="text-xl font-bold text-gray-900 mt-1">{{ sub.planName }} ({{ sub.planCode }})</h2>
            <p class="text-sm text-gray-600 mt-1">
              Statut : <span class="font-semibold text-indigo-700">{{ sub.status }}</span>
              @if (sub.isTrialActive && sub.trialEndsAt) {
                • Fin de l'essai gratuit le {{ sub.trialEndsAt | date:'mediumDate' }}
              }
            </p>
          </div>
          <div class="flex gap-3">
            <button (click)="openPortal()" class="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700">
              Gérer la facturation (Stripe)
            </button>
          </div>
        </div>
      }

      <h2 class="text-lg font-bold text-gray-900 mb-4">Nos Forfaits</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        @for (p of plans(); track p.id) {
          <div class="bg-white rounded-lg border border-gray-200 p-6 flex flex-col justify-between shadow-sm hover:border-indigo-300">
            <div>
              <h3 class="font-bold text-gray-900 text-lg">{{ p.name }}</h3>
              <p class="text-2xl font-extrabold text-indigo-600 mt-3">
                @if (p.priceCents === 0 && p.trialDays > 0) {
                  Gratuit <span class="text-xs text-gray-500 font-normal">({{ p.trialDays }} jours)</span>
                } @else if (p.priceCents === 0) {
                  Sur devis
                } @else {
                  {{ (p.priceCents / 100) | number:'1.0-0' }} {{ p.currency }}<span class="text-xs text-gray-500 font-normal">/mois</span>
                }
              </p>
            </div>
            <button (click)="selectPlan(p)" class="mt-6 w-full py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-indigo-600">
              Choisir ce plan
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class SubscriptionPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly plans = signal<Plan[]>([]);
  readonly subscription = signal<Subscription | null>(null);

  ngOnInit(): void {
    this.api.get<Plan[]>('billing/plans').subscribe({
      next: (data) => this.plans.set(data),
      error: () => undefined,
    });

    this.api.get<Subscription>('billing/subscription').subscribe({
      next: (data) => this.subscription.set(data),
      error: () => undefined,
    });
  }

  openPortal(): void {
    this.api.post<{ portalUrl: string }>('billing/portal', {}).subscribe({
      next: (res) => {
        if (res.portalUrl) {
          window.location.href = res.portalUrl;
        }
      },
      error: () => undefined,
    });
  }

  selectPlan(plan: Plan): void {
    this.api.post<{ checkoutUrl: string }>('billing/checkout', {
      planCode: plan.code,
      successUrl: window.location.href,
      cancelUrl: window.location.href,
    }).subscribe({
      next: (res) => {
        if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
        }
      },
      error: () => undefined,
    });
  }
}
