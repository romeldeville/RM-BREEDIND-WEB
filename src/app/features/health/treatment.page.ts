import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService } from '../../core/api/herd.service';
import { HealthProduct, HealthService, Treatment } from '../../core/api/health.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { HEALTH_STYLES } from './health-page.styles';
import { animalLabel, normalizeDate, todayDate } from './health-shared';

@Component({
  selector: 'app-health-treatment-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Traitement</h1>
          <p>Traitements vétérinaires et administrations, avec calcul des délais d’attente.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouveau traitement</h2>
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
            <span>Diagnostic</span>
            <input type="text" formControlName="diagnosis" />
          </label>
          <label class="field">
            <span>Date de début</span>
            <input type="date" formControlName="startDate" />
          </label>
          <label class="field">
            <span>Durée (jours)</span>
            <input type="number" formControlName="durationDays" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Traitements en cours</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (treatments().length === 0) {
          <p class="empty">Aucun traitement.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Diagnostic</th>
                <th>Statut</th>
                <th>Début</th>
                <th>Fin délai</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (treatment of treatments(); track treatment.id) {
                <tr>
                  <td>{{ treatment.diagnosis ?? 'Traitement' }}</td>
                  <td>{{ treatment.status }}</td>
                  <td>{{ treatment.startDate }}</td>
                  <td>{{ treatment.withdrawalEndDate ?? '-' }}</td>
                  <td>
                    <div class="row-actions">
                      <button
                        type="button"
                        class="btn btn--ghost"
                        [disabled]="saving()"
                        (click)="administer(treatment)"
                      >
                        Administrer
                      </button>
                    </div>
                  </td>
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
export class HealthTreatmentPage {
  private readonly health = inject(HealthService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly animals = signal<Animal[]>([]);
  readonly products = signal<HealthProduct[]>([]);
  readonly treatments = signal<Treatment[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    animalId: ['', [Validators.required]],
    productId: ['', [Validators.required]],
    diagnosis: [''],
    startDate: [todayDate(), [Validators.required]],
    durationDays: [3, [Validators.min(0)]],
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
    this.health.treatments().subscribe({
      next: (treatments) => {
        this.treatments.set(treatments);
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
    const startDate = normalizeDate(value.startDate);
    if (!startDate) {
      this.error.set('La date de début est invalide.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.health
      .createTreatment({
        animalId: value.animalId,
        productId: value.productId,
        diagnosis: value.diagnosis || null,
        startDate,
        durationDays: value.durationDays,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ diagnosis: '', startDate: todayDate(), durationDays: 3 });
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  administer(treatment: Treatment): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.health
      .addAdministration(treatment.id, { administeredAt: new Date().toISOString() })
      .subscribe({
        next: () => {
          this.saving.set(false);
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

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
