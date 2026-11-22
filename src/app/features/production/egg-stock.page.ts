import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { HerdService, Lot } from '../../core/api/herd.service';
import { EggMovement, EggStock, ProductionService } from '../../core/api/production.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PRODUCTION_STYLES } from './production-page.styles';
import { dateToInstant, formatTimestamp, shortId, todayDate } from './production-shared';

const MOVEMENT_TYPES = ['SALE', 'LOSS', 'ADJUSTMENT', 'TRANSFER', 'ENTRY'];

@Component({
  selector: 'app-production-egg-stock-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Stock d’œufs</h1>
          <p>Stocks par lot et mouvements d’œufs.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Stocks</h2>
        @if (stocks().length === 0) {
          <p class="empty">Aucun stock.</p>
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

      <section class="card panel">
        <h2>Nouveau mouvement</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Lot</span>
            <select formControlName="lotId">
              @for (lot of lots(); track lot.id) {
                <option [value]="lot.id">{{ lot.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Type</span>
            <select formControlName="type">
              @for (type of movementTypes; track type) {
                <option [value]="type">{{ type }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Quantité</span>
            <input type="number" formControlName="quantity" />
          </label>
          <label class="field">
            <span>Date</span>
            <input type="date" formControlName="occurredAt" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Mouvements récents</h2>
        @if (movements().length === 0) {
          <p class="empty">Aucun mouvement.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Quantité</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (movement of movements(); track movement.id) {
                <tr>
                  <td>{{ movement.type }}</td>
                  <td>{{ movement.quantity }}</td>
                  <td>{{ formatTimestamp(movement.occurredAt) }}</td>
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
export class ProductionEggStockPage {
  private readonly production = inject(ProductionService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly movementTypes = MOVEMENT_TYPES;
  readonly lots = signal<Lot[]>([]);
  readonly stocks = signal<EggStock[]>([]);
  readonly movements = signal<EggMovement[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly shortId = shortId;
  readonly formatTimestamp = formatTimestamp;

  readonly form = this.fb.nonNullable.group({
    lotId: ['', [Validators.required]],
    type: ['SALE', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    occurredAt: [todayDate(), [Validators.required]],
  });

  constructor() {
    this.herd.lots({ limit: 100 }).subscribe({
      next: (page) => {
        this.lots.set(page.items);
        if (page.items.length > 0 && !this.form.controls.lotId.value) {
          this.form.controls.lotId.setValue(page.items[0].id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.loadStocks();
    this.loadMovements();
  }

  loadStocks(): void {
    this.production.eggStocks().subscribe({
      next: (stocks) => this.stocks.set(stocks),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  loadMovements(): void {
    this.production.movements().subscribe({
      next: (movements) => this.movements.set(movements),
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
    this.production
      .createMovement({
        lotId: value.lotId,
        type: value.type,
        quantity: value.quantity,
        occurredAt: dateToInstant(value.occurredAt) ?? new Date().toISOString(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ quantity: 0 });
          this.loadStocks();
          this.loadMovements();
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
