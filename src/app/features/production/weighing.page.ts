import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService, Lot } from '../../core/api/herd.service';
import { ProductionService, Weighing } from '../../core/api/production.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PRODUCTION_STYLES } from './production-page.styles';
import { dateToInstant, formatQuantity, formatTimestamp, todayDate } from './production-shared';

@Component({
  selector: 'app-production-weighing-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Pesées</h1>
          <p>Enregistrer une pesée individuelle ou par lot.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouvelle pesée</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Cible</span>
            <select formControlName="target">
              <option value="ANIMAL">Animal</option>
              <option value="LOT">Lot</option>
            </select>
          </label>
          @if (form.controls.target.value === 'ANIMAL') {
            <label class="field">
              <span>Animal</span>
              <select formControlName="animalId">
                @for (animal of animals(); track animal.id) {
                  <option [value]="animal.id">{{ animalLabel(animal) }}</option>
                }
              </select>
            </label>
          } @else {
            <label class="field">
              <span>Lot</span>
              <select formControlName="lotId">
                @for (lot of lots(); track lot.id) {
                  <option [value]="lot.id">{{ lot.name }}</option>
                }
              </select>
            </label>
          }
          <label class="field">
            <span>Poids (kg)</span>
            <input type="number" formControlName="weightKg" />
          </label>
          @if (form.controls.target.value === 'LOT') {
            <label class="field">
              <span>Échantillon</span>
              <input type="number" formControlName="sampleCount" />
            </label>
          }
          <label class="field">
            <span>Date</span>
            <input type="date" formControlName="weighedAt" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Pesées récentes</h2>
        @if (weighings().length === 0) {
          <p class="empty">Aucune pesée.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Poids</th>
                <th>Date</th>
                <th>Cible</th>
              </tr>
            </thead>
            <tbody>
              @for (weighing of weighings(); track weighing.id) {
                <tr>
                  <td>{{ formatQuantity(weighing.averageWeight ?? weighing.weightKg) }} kg</td>
                  <td>{{ formatTimestamp(weighing.weighedAt) }}</td>
                  <td>{{ weighing.animalId ? 'Animal' : 'Lot' }}</td>
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
export class ProductionWeighingPage {
  private readonly production = inject(ProductionService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly animals = signal<Animal[]>([]);
  readonly lots = signal<Lot[]>([]);
  readonly weighings = signal<Weighing[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatQuantity = formatQuantity;
  readonly formatTimestamp = formatTimestamp;
  readonly animalLabel = (animal: Animal): string =>
    animal.name ? `${animal.identifier} - ${animal.name}` : animal.identifier;

  readonly form = this.fb.nonNullable.group({
    target: ['ANIMAL', [Validators.required]],
    animalId: [''],
    lotId: [''],
    weightKg: [0, [Validators.required, Validators.min(0.0001)]],
    sampleCount: [0],
    weighedAt: [todayDate(), [Validators.required]],
  });

  constructor() {
    this.herd.animals({ limit: 100 }).subscribe({
      next: (page) => {
        this.animals.set(page.items);
        if (page.items.length > 0 && !this.form.controls.animalId.value) {
          this.form.controls.animalId.setValue(page.items[0].id);
          this.loadWeighings();
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
    this.form.controls.target.valueChanges.subscribe(() => this.loadWeighings());
    this.loadWeighings();
  }

  loadWeighings(): void {
    const value = this.form.getRawValue();
    const query: Record<string, unknown> = {};
    if (value.target === 'ANIMAL' && value.animalId) {
      query['animalId'] = value.animalId;
    } else if (value.target === 'LOT' && value.lotId) {
      query['lotId'] = value.lotId;
    } else {
      this.weighings.set([]);
      return;
    }
    this.production.weighings(query).subscribe({
      next: (weighings) => this.weighings.set(weighings),
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
      .createWeighing({
        animalId: value.target === 'ANIMAL' ? value.animalId : null,
        lotId: value.target === 'LOT' ? value.lotId : null,
        weighedAt: dateToInstant(value.weighedAt) ?? new Date().toISOString(),
        weightKg: value.weightKg,
        sampleCount: value.target === 'LOT' && value.sampleCount > 0 ? value.sampleCount : null,
        averageWeight: value.target === 'LOT' && value.sampleCount > 0 ? value.weightKg : null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ weightKg: 0 });
          this.loadWeighings();
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
