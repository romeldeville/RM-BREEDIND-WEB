import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Expense, FinanceService } from '../../core/api/finance.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FINANCE_STYLES } from './finance-page.styles';
import { formatAmount } from './finance-shared';

@Component({
  selector: 'app-finance-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Finances</h1>
          <p>Dépenses, revenus, coûts et marges.</p>
        </div>
      </header>

      <nav class="toolbar">
        <a class="btn btn--primary" routerLink="/app/finance/expenses">Dépenses</a>
        <a class="btn btn--ghost" routerLink="/app/finance/revenues">Revenus</a>
        <a class="btn btn--ghost" routerLink="/app/finance/costs">Coûts &amp; marges</a>
      </nav>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Dépenses récentes</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (expenses().length === 0) {
          <p class="empty">Aucune dépense.</p>
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
              @for (expense of expenses(); track expense.id) {
                <tr>
                  <td>{{ expense.category }}</td>
                  <td>{{ formatAmount(expense.amount, expense.currency) }}</td>
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
export class FinancePage {
  private readonly financeService = inject(FinanceService);
  private readonly i18n = inject(I18nService);

  readonly expenses = signal<Expense[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly formatAmount = formatAmount;

  constructor() {
    this.financeService.expenses().subscribe({
      next: (expenses) => {
        this.expenses.set(expenses);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
