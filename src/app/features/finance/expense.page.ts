import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Expense, FinanceService } from '../../core/api/finance.service';
import { HerdService, Lot } from '../../core/api/herd.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FINANCE_STYLES } from './finance-page.styles';
import { formatAmount, normalizeDate, todayDate } from './finance-shared';

@Component({
  selector: 'app-finance-expense-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Dépenses</h1>
          <p>Enregistrer et consulter les dépenses.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouvelle dépense</h2>
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
            <span>Lot</span>
            <select formControlName="lotId">
              <option value="">—</option>
              @for (lot of lots(); track lot.id) {
                <option [value]="lot.id">{{ lot.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Description</span>
            <input type="text" formControlName="description" />
          </label>
          <label class="field">
            <span>Fournisseur</span>
            <input type="text" formControlName="supplier" />
          </label>
          <label class="field">
            <span>Date</span>
            <input type="date" formControlName="incurredAt" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Dépenses</h2>
        @if (expenses().length === 0) {
          <p class="empty">Aucune dépense.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Montant</th>
                <th>Fournisseur</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (expense of expenses(); track expense.id) {
                <tr>
                  <td>{{ expense.category }}</td>
                  <td>{{ formatAmount(expense.amount, expense.currency) }}</td>
                  <td>{{ expense.supplier ?? '-' }}</td>
                  <td>{{ expense.incurredAt }}</td>
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
export class FinanceExpensePage {
  private readonly financeService = inject(FinanceService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly expenses = signal<Expense[]>([]);
  readonly lots = signal<Lot[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatAmount = formatAmount;

  readonly form = this.fb.nonNullable.group({
    category: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.0001)]],
    lotId: [''],
    description: [''],
    supplier: [''],
    incurredAt: [todayDate(), [Validators.required]],
  });

  constructor() {
    this.herd.lots({ limit: 100 }).subscribe({
      next: (page) => this.lots.set(page.items),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.load();
  }

  load(): void {
    this.financeService.expenses().subscribe({
      next: (expenses) => this.expenses.set(expenses),
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
      .createExpense({
        category: value.category,
        amount: value.amount,
        currency: 'XOF',
        incurredAt: normalizeDate(value.incurredAt) ?? todayDate(),
        description: value.description || null,
        supplier: value.supplier || null,
        lotId: value.lotId || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ category: '', amount: 0, description: '', supplier: '' });
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
