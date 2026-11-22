import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { HerdService, Lot } from '../../core/api/herd.service';
import { EggCollection, ProductionService } from '../../core/api/production.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PRODUCTION_STYLES } from './production-page.styles';
import { dateToInstant, formatTimestamp, todayDate } from './production-shared';

@Component({
  selector: 'app-production-collection-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Ramassage d’œufs</h1>
          <p>Enregistrer un ramassage pour un lot.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouveau ramassage</h2>
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
            <span>Œufs collectés</span>
            <input type="number" formControlName="collected" />
          </label>
          <label class="field">
            <span>Cassés</span>
            <input type="number" formControlName="broken" />
          </label>
          <label class="field">
            <span>Écartés</span>
            <input type="number" formControlName="downgraded" />
          </label>
          <label class="field">
            <span>Date</span>
            <input type="date" formControlName="collectedAt" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Ramassages récents</h2>
        @if (collections().length === 0) {
          <p class="empty">Aucun ramassage.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Collectés</th>
                <th>Vendables</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (collection of collections(); track collection.id) {
                <tr>
                  <td>{{ collection.collected }}</td>
                  <td>{{ collection.sellable }}</td>
                  <td>{{ formatTimestamp(collection.collectedAt) }}</td>
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
export class ProductionCollectionPage {
  private readonly production = inject(ProductionService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly lots = signal<Lot[]>([]);
  readonly collections = signal<EggCollection[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatTimestamp = formatTimestamp;

  readonly form = this.fb.nonNullable.group({
    lotId: ['', [Validators.required]],
    collected: [0, [Validators.required, Validators.min(0)]],
    broken: [0],
    downgraded: [0],
    collectedAt: [todayDate(), [Validators.required]],
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
    this.loadCollections();
  }

  loadCollections(): void {
    this.production.collections().subscribe({
      next: (collections) => this.collections.set(collections),
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
      .createCollection({
        lotId: value.lotId,
        collectedAt: dateToInstant(value.collectedAt) ?? new Date().toISOString(),
        collected: value.collected,
        broken: value.broken,
        downgraded: value.downgraded,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ collected: 0, broken: 0, downgraded: 0 });
          this.loadCollections();
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
