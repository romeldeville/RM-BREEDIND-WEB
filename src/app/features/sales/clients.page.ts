import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Customer, SalesService } from '../../core/api/sales.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SALES_STYLES } from './sales-page.styles';
import { formatAmount } from './sales-shared';

@Component({
  selector: 'app-sales-clients-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Clients</h1>
          <p>Gérer les clients et leurs coordonnées.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouveau client</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Nom</span>
            <input type="text" formControlName="name" />
          </label>
          <label class="field">
            <span>Téléphone</span>
            <input type="text" formControlName="phone" />
          </label>
          <label class="field">
            <span>Email</span>
            <input type="email" formControlName="email" />
          </label>
          <label class="field">
            <span>Adresse</span>
            <input type="text" formControlName="address" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Clients</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (customers().length === 0) {
          <p class="empty">Aucun client.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>Solde</th>
              </tr>
            </thead>
            <tbody>
              @for (customer of customers(); track customer.id) {
                <tr>
                  <td>{{ customer.name }}</td>
                  <td>{{ customer.phone ?? '-' }}</td>
                  <td>{{ customer.email ?? '-' }}</td>
                  <td>{{ formatAmount(customer.balance) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [SALES_STYLES],
})
export class SalesClientsPage {
  private readonly salesService = inject(SalesService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatAmount = formatAmount;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    phone: [''],
    email: [''],
    address: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.salesService.customers().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
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
    this.salesService
      .createCustomer({
        name: value.name,
        phone: value.phone || null,
        email: value.email || null,
        address: value.address || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.reset({ name: '', phone: '', email: '', address: '' });
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
