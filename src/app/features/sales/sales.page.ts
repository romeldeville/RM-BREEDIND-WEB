import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Sale, SalesService } from '../../core/api/sales.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SALES_STYLES } from './sales-page.styles';
import { formatAmount, formatTimestamp, paymentStatusLabel, saleStatusLabel } from './sales-shared';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Ventes</h1>
          <p>Ventes, clients et encaissements.</p>
        </div>
      </header>

      <nav class="toolbar">
        <a class="btn btn--primary" routerLink="/app/sales/new">Nouvelle vente</a>
        <a class="btn btn--ghost" routerLink="/app/sales/payments">Paiements</a>
        <a class="btn btn--ghost" routerLink="/app/sales/clients">Clients</a>
      </nav>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Ventes récentes</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (sales().length === 0) {
          <p class="empty">Aucune vente.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Paiement</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (sale of sales(); track sale.id) {
                <tr>
                  <td>{{ sale.number }}</td>
                  <td>{{ formatAmount(sale.totalAmount, sale.currency) }}</td>
                  <td>{{ saleStatusLabel(sale.status) }}</td>
                  <td>{{ paymentStatusLabel(sale.paymentStatus) }}</td>
                  <td>{{ formatTimestamp(sale.soldAt) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [SALES_STYLES],
})
export class SalesPage {
  private readonly salesService = inject(SalesService);
  private readonly i18n = inject(I18nService);

  readonly sales = signal<Sale[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly formatAmount = formatAmount;
  readonly formatTimestamp = formatTimestamp;
  readonly paymentStatusLabel = paymentStatusLabel;
  readonly saleStatusLabel = saleStatusLabel;

  constructor() {
    this.salesService.sales().subscribe({
      next: (sales) => {
        this.sales.set(sales);
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
