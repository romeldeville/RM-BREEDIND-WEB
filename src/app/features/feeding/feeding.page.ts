import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FeedingService, LowStockAlert } from '../../core/api/feeding.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FEEDING_STYLES } from './feeding-page.styles';
import { formatQuantity, shortId } from './feeding-shared';

@Component({
  selector: 'app-feeding-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Alimentation</h1>
          <p>Aliments, réceptions, distributions, stocks et plans d’alimentation.</p>
        </div>
      </header>

      <nav class="toolbar">
        <a class="btn btn--primary" routerLink="/app/feeding/feeds">Aliments</a>
        <a class="btn btn--ghost" routerLink="/app/feeding/receipts">Réception</a>
        <a class="btn btn--ghost" routerLink="/app/feeding/distributions">Distribution</a>
        <a class="btn btn--ghost" routerLink="/app/feeding/stocks">Stocks</a>
        <a class="btn btn--ghost" routerLink="/app/feeding/plans">Plans</a>
      </nav>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Stocks bas</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (alerts().length === 0) {
          <p class="empty">Aucun stock sous le seuil.</p>
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
                  <td>{{ formatQuantity(alert.quantity) }} {{ alert.unit ?? '' }}</td>
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
export class FeedingPage {
  private readonly feeding = inject(FeedingService);
  private readonly i18n = inject(I18nService);

  readonly alerts = signal<LowStockAlert[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly shortId = shortId;
  readonly formatQuantity = formatQuantity;

  constructor() {
    this.feeding.lowStock().subscribe({
      next: (alerts) => {
        this.alerts.set(alerts);
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
