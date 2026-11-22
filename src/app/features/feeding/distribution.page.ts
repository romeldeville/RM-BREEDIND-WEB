import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Feed, FeedDistribution, FeedingService } from '../../core/api/feeding.service';
import { Animal, HerdService, Lot } from '../../core/api/herd.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FEEDING_STYLES } from './feeding-page.styles';
import { dateToInstant, formatQuantity, formatTimestamp, shortId, todayDate } from './feeding-shared';

@Component({
  selector: 'app-feeding-distribution-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Distribution d’aliment</h1>
          <p>Enregistrer une consommation pour un lot ou un animal.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouvelle distribution</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Aliment</span>
            <select formControlName="feedId">
              @for (feed of feeds(); track feed.id) {
                <option [value]="feed.id">{{ feed.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Cible</span>
            <select formControlName="target">
              <option value="LOT">Lot</option>
              <option value="ANIMAL">Animal</option>
            </select>
          </label>
          @if (form.controls.target.value === 'LOT') {
            <label class="field">
              <span>Lot</span>
              <select formControlName="lotId">
                @for (lot of lots(); track lot.id) {
                  <option [value]="lot.id">{{ lot.name }}</option>
                }
              </select>
            </label>
          } @else {
            <label class="field">
              <span>Animal</span>
              <select formControlName="animalId">
                @for (animal of animals(); track animal.id) {
                  <option [value]="animal.id">{{ animalLabel(animal) }}</option>
                }
              </select>
            </label>
          }
          <label class="field">
            <span>Quantité</span>
            <input type="number" formControlName="quantity" />
          </label>
          <label class="field">
            <span>Date</span>
            <input type="date" formControlName="distributedAt" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Distributions récentes</h2>
        @if (distributions().length === 0) {
          <p class="empty">Aucune distribution.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Quantité</th>
                <th>Date</th>
                <th>Cible</th>
              </tr>
            </thead>
            <tbody>
              @for (distribution of distributions(); track distribution.id) {
                <tr>
                  <td>{{ formatQuantity(distribution.quantity) }}</td>
                  <td>{{ formatTimestamp(distribution.distributedAt) }}</td>
                  <td>
                    {{
                      distribution.lotId
                        ? 'Lot ' + shortId(distribution.lotId)
                        : 'Animal ' + shortId(distribution.animalId)
                    }}
                  </td>
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
export class FeedingDistributionPage {
  private readonly feeding = inject(FeedingService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly feeds = signal<Feed[]>([]);
  readonly lots = signal<Lot[]>([]);
  readonly animals = signal<Animal[]>([]);
  readonly distributions = signal<FeedDistribution[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly shortId = shortId;
  readonly formatQuantity = formatQuantity;
  readonly formatTimestamp = formatTimestamp;
  readonly animalLabel = (animal: Animal): string =>
    animal.name ? `${animal.identifier} - ${animal.name}` : animal.identifier;

  readonly form = this.fb.nonNullable.group({
    feedId: ['', [Validators.required]],
    target: ['LOT', [Validators.required]],
    lotId: [''],
    animalId: [''],
    quantity: [0, [Validators.required, Validators.min(0.0001)]],
    distributedAt: [todayDate(), [Validators.required]],
  });

  constructor() {
    this.feeding.feeds().subscribe({
      next: (feeds) => {
        this.feeds.set(feeds);
        if (feeds.length > 0 && !this.form.controls.feedId.value) {
          this.form.controls.feedId.setValue(feeds[0].id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.herd.lots({ limit: 100 }).subscribe({
      next: (page) => {
        this.lots.set(page.items);
        if (page.items.length > 0 && !this.form.controls.lotId.value) {
          this.form.controls.lotId.setValue(page.items[0].id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.herd.animals({ limit: 100 }).subscribe({
      next: (page) => {
        this.animals.set(page.items);
        if (page.items.length > 0 && !this.form.controls.animalId.value) {
          this.form.controls.animalId.setValue(page.items[0].id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.loadDistributions();
  }

  loadDistributions(): void {
    this.feeding.distributions().subscribe({
      next: (distributions) => this.distributions.set(distributions),
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
    this.feeding
      .distribute({
        feedId: value.feedId,
        lotId: value.target === 'LOT' ? value.lotId : null,
        animalId: value.target === 'ANIMAL' ? value.animalId : null,
        quantity: value.quantity,
        distributedAt: dateToInstant(value.distributedAt) ?? new Date().toISOString(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ quantity: 0 });
          this.loadDistributions();
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
