import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService } from '../../core/api/herd.service';
import { HealthService, SaleEligibility, Withdrawal } from '../../core/api/health.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { HEALTH_STYLES } from './health-page.styles';
import { animalLabel } from './health-shared';

@Component({
  selector: 'app-health-withdrawals-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Délais d’attente</h1>
          <p>Suivi des délais d’attente et contrôle du blocage de vente (T-03).</p>
        </div>
        <div class="actions">
          <button type="button" class="btn btn--ghost" (click)="setFilter('ACTIVE')">
            Actifs
          </button>
          <button type="button" class="btn btn--ghost" (click)="setFilter('')">Tous</button>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Délais d’attente</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (withdrawals().length === 0) {
          <p class="empty">Aucun délai d’attente.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Animal / lot</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              @for (withdrawal of withdrawals(); track withdrawal.id) {
                <tr>
                  <td>{{ withdrawal.type }}</td>
                  <td>
                    {{ withdrawal.animalId ? 'Animal ' + withdrawal.animalId : 'Lot ' + (withdrawal.lotId ?? '-') }}
                  </td>
                  <td>{{ withdrawal.startDate }}</td>
                  <td>{{ withdrawal.endDate }}</td>
                  <td>{{ withdrawal.status }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      <section class="card panel">
        <h2>Vérification vente</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="check()">
          <label class="field">
            <span>Animal</span>
            <select formControlName="animalId">
              @for (animal of animals(); track animal.id) {
                <option [value]="animal.id">{{ label(animal) }}</option>
              }
            </select>
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="checking()">
            {{ checking() ? 'Vérification...' : 'Vérifier' }}
          </button>
        </form>
        @if (eligibility(); as result) {
          <p [class.status-ok]="result.allowed" [class.status-blocked]="!result.allowed">
            {{ result.allowed ? 'Vente autorisée' : 'Vente bloquée (' + result.blockingWithdrawals.length + ' délai(s))' }}
          </p>
        }
      </section>
    </section>
  `,
  styles: [HEALTH_STYLES],
})
export class HealthWithdrawalsPage {
  private readonly health = inject(HealthService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly withdrawals = signal<Withdrawal[]>([]);
  readonly animals = signal<Animal[]>([]);
  readonly eligibility = signal<SaleEligibility | null>(null);
  readonly loading = signal(true);
  readonly checking = signal(false);
  readonly error = signal<string | null>(null);

  private filter = 'ACTIVE';

  readonly form = this.fb.nonNullable.group({
    animalId: [''],
  });

  constructor() {
    this.load();
  }

  setFilter(filter: string): void {
    this.filter = filter;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.health.withdrawals(this.filter ? { status: this.filter } : {}).subscribe({
      next: (withdrawals) => {
        this.withdrawals.set(withdrawals);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
    this.herd.animals({ limit: 100 }).subscribe({
      next: (page) => {
        this.animals.set(page.items);
        if (!this.form.getRawValue().animalId && page.items.length > 0) {
          this.form.patchValue({ animalId: page.items[0].id });
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  check(): void {
    const animalId = this.form.getRawValue().animalId;
    if (!animalId) {
      return;
    }
    this.checking.set(true);
    this.error.set(null);
    this.eligibility.set(null);
    this.health.saleEligibility({ animalId }).subscribe({
      next: (eligibility) => {
        this.eligibility.set(eligibility);
        this.checking.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.checking.set(false);
        this.error.set(this.messageFor(error));
      },
    });
  }

  label(animal: Animal): string {
    return animalLabel(animal);
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
