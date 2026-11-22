import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { HealthProduct, HealthService } from '../../core/api/health.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { HEALTH_STYLES } from './health-page.styles';

@Component({
  selector: 'app-health-products-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Produits vétérinaires</h1>
          <p>Vaccins, antibiotiques et antiparasitaires avec leurs délais d’attente.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouveau produit</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="create()">
          <label class="field">
            <span>Nom</span>
            <input type="text" formControlName="name" />
          </label>
          <label class="field">
            <span>Type</span>
            <select formControlName="type">
              @for (type of types; track type) {
                <option [value]="type">{{ type }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Délai viande (j)</span>
            <input type="number" formControlName="withdrawalMeatDays" />
          </label>
          <label class="field">
            <span>Délai lait (j)</span>
            <input type="number" formControlName="withdrawalMilkDays" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Créer le produit' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Produits</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (products().length === 0) {
          <p class="empty">Aucun produit vétérinaire.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Délai viande</th>
                <th>Délai lait</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              @for (product of products(); track product.id) {
                <tr>
                  <td>{{ product.name }}</td>
                  <td>{{ product.type ?? '-' }}</td>
                  <td>{{ product.withdrawalMeatDays }} j</td>
                  <td>{{ product.withdrawalMilkDays }} j</td>
                  <td>{{ product.stockQty ?? '-' }}</td>
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
export class HealthProductsPage {
  private readonly health = inject(HealthService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly types = ['VACCINE', 'ANTIBIOTIC', 'ANTIPARASITIC', 'OTHER'];
  readonly products = signal<HealthProduct[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    type: ['VACCINE', [Validators.required]],
    withdrawalMeatDays: [0, [Validators.min(0)]],
    withdrawalMilkDays: [0, [Validators.min(0)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.health.products().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  create(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.health.createProduct(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset({
          name: '',
          type: 'VACCINE',
          withdrawalMeatDays: 0,
          withdrawalMilkDays: 0,
        });
        this.load();
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
