import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Animal, HerdService, Lot } from '../../core/api/herd.service';
import { Customer, SalesService } from '../../core/api/sales.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SALES_STYLES } from './sales-page.styles';
import { dateToInstant, todayDate } from './sales-shared';

@Component({
  selector: 'app-sale-form-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Nouvelle vente</h1>
          <p>Enregistrer une vente d’animal, de lot ou d’œufs.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Vente</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Client</span>
            <select formControlName="customerId">
              <option value="">—</option>
              @for (customer of customers(); track customer.id) {
                <option [value]="customer.id">{{ customer.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Type</span>
            <select formControlName="type">
              <option value="ANIMAL">Animal</option>
              <option value="LOT">Lot</option>
              <option value="EGGS">Œufs</option>
              <option value="OTHER">Autre</option>
            </select>
          </label>
          @if (form.controls.type.value === 'ANIMAL') {
            <label class="field">
              <span>Animal</span>
              <select formControlName="animalId">
                @for (animal of animals(); track animal.id) {
                  <option [value]="animal.id">{{ animalLabel(animal) }}</option>
                }
              </select>
            </label>
          } @else if (form.controls.type.value === 'LOT' || form.controls.type.value === 'EGGS') {
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
              <span>Description</span>
              <input type="text" formControlName="description" />
            </label>
          }
          @if (form.controls.type.value !== 'ANIMAL') {
            <label class="field">
              <span>Quantité</span>
              <input type="number" formControlName="quantity" />
            </label>
          }
          <label class="field">
            <span>Prix unitaire</span>
            <input type="number" formControlName="unitPrice" />
          </label>
          <label class="field">
            <span>Date</span>
            <input type="date" formControlName="soldAt" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>
    </section>
  `,
  styles: [SALES_STYLES],
})
export class SaleFormPage {
  private readonly sales = inject(SalesService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly customers = signal<Customer[]>([]);
  readonly animals = signal<Animal[]>([]);
  readonly lots = signal<Lot[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly animalLabel = (animal: Animal): string =>
    animal.name ? `${animal.identifier} - ${animal.name}` : animal.identifier;

  readonly form = this.fb.nonNullable.group({
    customerId: [''],
    type: ['ANIMAL', [Validators.required]],
    animalId: [''],
    lotId: [''],
    description: [''],
    quantity: [1, [Validators.required, Validators.min(0.0001)]],
    unitPrice: [0, [Validators.required, Validators.min(0)]],
    soldAt: [todayDate(), [Validators.required]],
  });

  constructor() {
    this.sales.customers().subscribe({
      next: (customers) => this.customers.set(customers),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.herd.animals({ limit: 100 }).subscribe({
      next: (page) => {
        this.animals.set(page.items);
        if (page.items.length > 0) {
          this.form.controls.animalId.setValue(page.items[0].id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.herd.lots({ limit: 100 }).subscribe({
      next: (page) => {
        this.lots.set(page.items);
        if (page.items.length > 0) {
          this.form.controls.lotId.setValue(page.items[0].id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const quantity = value.type === 'ANIMAL' ? 1 : value.quantity;
    this.saving.set(true);
    this.error.set(null);
    this.sales
      .createSale({
        customerId: value.customerId || null,
        type: value.type,
        soldAt: dateToInstant(value.soldAt) ?? new Date().toISOString(),
        currency: 'XOF',
        lines: [
          {
            itemType: value.type,
            animalId: value.type === 'ANIMAL' ? value.animalId : null,
            lotId: value.type === 'LOT' || value.type === 'EGGS' ? value.lotId : null,
            description: value.description || null,
            quantity,
            unitPrice: value.unitPrice,
          },
        ],
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          void this.router.navigateByUrl('/app/sales');
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
