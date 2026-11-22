import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EggStock, ProductionService } from '../../core/api/production.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PRODUCTION_STYLES } from './production-page.styles';
import { formatTimestamp, shortId } from './production-shared';

@Component({
  selector: 'app-production-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Production</h1>
          <p>Pesées, croissance, ramassages et stock d’œufs.</p>
        </div>
      </header>

      <nav class="toolbar">
        <a class="btn btn--primary" routerLink="/app/production/weighings">Pesées</a>
        <a class="btn btn--ghost" routerLink="/app/production/growth">Croissance</a>
        <a class="btn btn--ghost" routerLink="/app/production/collections">Ramassage</a>
        <a class="btn btn--ghost" routerLink="/app/production/egg-stocks">Stock d’œufs</a>
      </nav>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Stock d’œufs</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (stocks().length === 0) {
          <p class="empty">Aucun stock d’œufs.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Cible</th>
                <th>Quantité</th>
                <th>Mise à jour</th>
              </tr>
            </thead>
            <tbody>
              @for (stock of stocks(); track stock.farmId + (stock.lotId ?? '')) {
                <tr>
                  <td>{{ stock.lotId ? 'Lot ' + shortId(stock.lotId) : 'Ferme' }}</td>
                  <td>{{ stock.quantity }} œufs</td>
                  <td>{{ formatTimestamp(stock.updatedAt) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [PRODUCTION_STYLES],
})
export class ProductionPage {
  private readonly production = inject(ProductionService);
  private readonly i18n = inject(I18nService);

  readonly stocks = signal<EggStock[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly shortId = shortId;
  readonly formatTimestamp = formatTimestamp;

  constructor() {
    this.production.eggStocks().subscribe({
      next: (stocks) => {
        this.stocks.set(stocks);
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
