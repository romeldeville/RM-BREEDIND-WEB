import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Payment, Sale, SalesService } from '../../core/api/sales.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SALES_STYLES } from './sales-page.styles';
import { dateToInstant, formatAmount, formatTimestamp, todayDate } from './sales-shared';

@Component({
  selector: 'app-sales-payments-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Paiements</h1>
          <p>Enregistrer et consulter les paiements d’une vente.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouveau paiement</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Vente</span>
            <select formControlName="saleId">
              @for (sale of sales(); track sale.id) {
                <option [value]="sale.id">
                  {{ sale.number }} — {{ formatAmount(sale.totalAmount, sale.currency) }}
                </option>
              }
            </select>
          </label>
          <label class="field">
            <span>Montant</span>
            <input type="number" formControlName="amount" />
          </label>
          <label class="field">
            <span>Méthode</span>
            <select formControlName="method">
              <option value="CASH">Espèces</option>
              <option value="MOBILE_MONEY">Mobile money</option>
              <option value="BANK_TRANSFER">Virement</option>
              <option value="CARD">Carte</option>
              <option value="CREDIT">Crédit</option>
            </select>
          </label>
          <label class="field">
            <span>Référence</span>
            <input type="text" formControlName="reference" />
          </label>
          <label class="field">
            <span>Date</span>
            <input type="date" formControlName="paidAt" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Paiements enregistrés</h2>
        @if (payments().length === 0) {
          <p class="empty">Aucun paiement.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Montant</th>
                <th>Méthode</th>
                <th>Date</th>
                <th>Référence</th>
              </tr>
            </thead>
            <tbody>
              @for (payment of payments(); track payment.id) {
                <tr>
                  <td>{{ formatAmount(payment.amount) }}</td>
                  <td>{{ payment.method }}</td>
                  <td>{{ formatTimestamp(payment.paidAt) }}</td>
                  <td>{{ payment.reference ?? '-' }}</td>
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
export class SalesPaymentsPage {
  private readonly salesService = inject(SalesService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly sales = signal<Sale[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatAmount = formatAmount;
  readonly formatTimestamp = formatTimestamp;

  readonly form = this.fb.nonNullable.group({
    saleId: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.0001)]],
    method: ['CASH', [Validators.required]],
    reference: [''],
    paidAt: [todayDate(), [Validators.required]],
  });

  constructor() {
    this.form.controls.saleId.valueChanges.subscribe((saleId) => this.loadPayments(saleId));
    this.salesService.sales().subscribe({
      next: (sales) => {
        this.sales.set(sales);
        if (sales.length > 0) {
          this.form.controls.saleId.setValue(sales[0].id);
          this.loadPayments(sales[0].id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  loadPayments(saleId: string): void {
    if (!saleId) {
      this.payments.set([]);
      return;
    }
    this.salesService.payments(saleId).subscribe({
      next: (payments) => this.payments.set(payments),
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
    this.salesService
      .addPayment(value.saleId, {
        amount: value.amount,
        method: value.method,
        paidAt: dateToInstant(value.paidAt) ?? new Date().toISOString(),
        reference: value.reference || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ amount: 0, reference: '' });
          this.loadPayments(value.saleId);
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
