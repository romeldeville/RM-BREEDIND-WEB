import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { FeedStock, FeedingService, LowStockAlert } from '../../core/api/feeding.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FEEDING_STYLES } from './feeding-page.styles';
import { formatQuantity, shortId } from './feeding-shared';

@Component({
  selector: 'app-feeding-stock-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Stocks d’aliments</h1>
          <p>Projection des stocks et alertes de stock bas.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Seuil de stock bas</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="applyThreshold()">
          <label class="field">
            <span>Seuil</span>
            <input type="number" formControlName="threshold" />
          </label>
          <button type="submit" class="btn btn--primary">Appliquer</button>
        </form>
      </section>

      <section class="card panel">
        <h2>Stocks</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (stocks().length === 0) {
          <p class="empty">Aucun stock.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Aliment</th>
                <th>Quantité</th>
                <th>Prix moyen</th>
              </tr>
            </thead>
            <tbody>
              @for (stock of stocks(); track stock.feedId) {
                <tr>
                  <td>{{ stock.feedName ?? shortId(stock.feedId) }}</td>
                  <td>{{ formatQuantity(stock.quantity) }} {{ stock.unit ?? '' }}</td>
                  <td>{{ stock.averagePrice ?? '-' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      <section class="card panel">
        <h2>Alertes de stock bas</h2>
        @if (alerts().length === 0) {
          <p class="empty">Aucune alerte.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Aliment</th>
                <th>Stock</th>
                <th>Seuil</th>
              </tr>
            </thead>
            <tbody>
              @for (alert of alerts(); track alert.feedId) {
                <tr>
                  <td>{{ alert.feedName ?? shortId(alert.feedId) }}</td>
                  <td>{{ formatQuantity(alert.quantity) }}</td>
                  <td>{{ formatQuantity(alert.threshold) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [FEEDING_STYLES],
})
export class FeedingStockPage {
  private readonly feeding = inject(FeedingService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly stocks = signal<FeedStock[]>([]);
  readonly alerts = signal<LowStockAlert[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly shortId = shortId;
  readonly formatQuantity = formatQuantity;

  readonly form = this.fb.nonNullable.group({
    threshold: [0],
  });

  constructor() {
    this.feeding.stocks().subscribe({
      next: (stocks) => {
        this.stocks.set(stocks);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.feeding.lowStock({ threshold: this.form.controls.threshold.value }).subscribe({
      next: (alerts) => this.alerts.set(alerts),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  applyThreshold(): void {
    this.loadAlerts();
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
