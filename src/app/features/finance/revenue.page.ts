import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { FinanceService, Revenue } from '../../core/api/finance.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FINANCE_STYLES } from './finance-page.styles';
import { formatAmount, normalizeDate, todayDate } from './finance-shared';

@Component({
  selector: 'app-finance-revenue-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Revenus</h1>
          <p>Enregistrer et consulter les revenus.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouveau revenu</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Catégorie</span>
            <input type="text" formControlName="category" />
          </label>
          <label class="field">
            <span>Montant</span>
            <input type="number" formControlName="amount" />
          </label>
          <label class="field">
            <span>Description</span>
            <input type="text" formControlName="description" />
          </label>
          <label class="field">
            <span>Date</span>
            <input type="date" formControlName="receivedAt" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Revenus</h2>
        @if (revenues().length === 0) {
          <p class="empty">Aucun revenu.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Montant</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (revenue of revenues(); track revenue.id) {
                <tr>
                  <td>{{ revenue.category }}</td>
                  <td>{{ formatAmount(revenue.amount, revenue.currency) }}</td>
                  <td>{{ revenue.receivedAt }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [FINANCE_STYLES],
})
export class FinanceRevenuePage {
  private readonly financeService = inject(FinanceService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly revenues = signal<Revenue[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatAmount = formatAmount;

  readonly form = this.fb.nonNullable.group({
    category: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.0001)]],
    description: [''],
    receivedAt: [todayDate(), [Validators.required]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.financeService.revenues().subscribe({
      next: (revenues) => this.revenues.set(revenues),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.financeService
      .createRevenue({
        category: value.category,
        amount: value.amount,
        currency: 'XOF',
        receivedAt: normalizeDate(value.receivedAt) ?? todayDate(),
        description: value.description || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ category: '', amount: 0, description: '' });
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
