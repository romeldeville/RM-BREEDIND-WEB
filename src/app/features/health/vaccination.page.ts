import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService } from '../../core/api/herd.service';
import { HealthProduct, HealthService, Vaccination } from '../../core/api/health.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { HEALTH_STYLES } from './health-page.styles';
import { animalLabel, dateToInstant, formatTimestamp, shortId, todayDate } from './health-shared';

@Component({
  selector: 'app-health-vaccination-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Vaccination</h1>
          <p>Enregistrement des vaccinations par animal.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouvelle vaccination</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="save()">
          <label class="field">
            <span>Animal</span>
            <select formControlName="animalId">
              @for (animal of animals(); track animal.id) {
                <option [value]="animal.id">{{ label(animal) }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Produit</span>
            <select formControlName="productId">
              @for (product of products(); track product.id) {
                <option [value]="product.id">{{ product.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Date</span>
            <input type="date" formControlName="performedAt" />
          </label>
          <label class="field">
            <span>N° de lot du vaccin</span>
            <input type="text" formControlName="vaccineLot" />
          </label>
          <label class="field">
            <span>Dose</span>
            <input type="text" formControlName="dose" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Vaccinations récentes</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (vaccinations().length === 0) {
          <p class="empty">Aucune vaccination enregistrée.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Animal / lot</th>
                <th>Date</th>
                <th>Lot vaccin</th>
              </tr>
            </thead>
            <tbody>
              @for (vaccination of vaccinations(); track vaccination.id) {
                <tr>
                  <td>
                    {{ vaccination.animalId ? 'Animal ' + shortId(vaccination.animalId) : 'Lot ' + shortId(vaccination.lotId) }}
                  </td>
                  <td>{{ format(vaccination.performedAt) }}</td>
                  <td>{{ vaccination.vaccineLot ?? '-' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [HEALTH_STYLES],
})
export class HealthVaccinationPage {
  private readonly health = inject(HealthService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly animals = signal<Animal[]>([]);
  readonly products = signal<HealthProduct[]>([]);
  readonly vaccinations = signal<Vaccination[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    animalId: ['', [Validators.required]],
    productId: ['', [Validators.required]],
    performedAt: [todayDate(), [Validators.required]],
    vaccineLot: [''],
    dose: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.herd.animals({ limit: 100 }).subscribe({
      next: (page) => {
        this.animals.set(page.items);
        if (!this.form.getRawValue().animalId && page.items.length > 0) {
          this.form.patchValue({ animalId: page.items[0].id });
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.health.products().subscribe({
      next: (products) => {
        this.products.set(products);
        if (!this.form.getRawValue().productId && products.length > 0) {
          this.form.patchValue({ productId: products[0].id });
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.health.vaccinations().subscribe({
      next: (vaccinations) => {
        this.vaccinations.set(vaccinations);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const performedAt = dateToInstant(value.performedAt);
    if (!performedAt) {
      this.error.set('La date est invalide.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.health
      .recordVaccination({
        animalId: value.animalId,
        productId: value.productId,
        performedAt,
        vaccineLot: value.vaccineLot || null,
        dose: value.dose || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ vaccineLot: '', dose: '', performedAt: todayDate() });
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  label(animal: Animal): string {
    return animalLabel(animal);
  }

  shortId(value: string | null): string {
    return shortId(value);
  }

  format(value: string | null): string {
    return formatTimestamp(value);
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
