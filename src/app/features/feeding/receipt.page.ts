import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Feed, FeedReceipt, FeedingService } from '../../core/api/feeding.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FEEDING_STYLES } from './feeding-page.styles';
import { dateToInstant, formatQuantity, formatTimestamp, todayDate } from './feeding-shared';

@Component({
  selector: 'app-feeding-receipt-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Réception d’aliment</h1>
          <p>Enregistrer une entrée de stock et son prix.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouvelle réception</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Aliment</span>
            <select formControlName="feedId" (change)="selectFeed()">
              @for (feed of feeds(); track feed.id) {
                <option [value]="feed.id">{{ feed.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Quantité</span>
            <input type="number" formControlName="quantity" />
          </label>
          <label class="field">
            <span>Prix unitaire</span>
            <input type="number" formControlName="unitPrice" />
          </label>
          <label class="field">
            <span>Date</span>
            <input type="date" formControlName="receivedAt" />
          </label>
          <label class="field">
            <span>Fournisseur</span>
            <input type="text" formControlName="supplier" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Réceptions récentes</h2>
        @if (receipts().length === 0) {
          <p class="empty">Aucune réception.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Quantité</th>
                <th>Prix</th>
                <th>Date</th>
                <th>Fournisseur</th>
              </tr>
            </thead>
            <tbody>
              @for (receipt of receipts(); track receipt.id) {
                <tr>
                  <td>{{ formatQuantity(receipt.quantity) }}</td>
                  <td>{{ receipt.unitPrice ?? '-' }}</td>
                  <td>{{ formatTimestamp(receipt.receivedAt) }}</td>
                  <td>{{ receipt.supplier ?? '-' }}</td>
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
export class FeedingReceiptPage {
  private readonly feeding = inject(FeedingService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly feeds = signal<Feed[]>([]);
  readonly receipts = signal<FeedReceipt[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatQuantity = formatQuantity;
  readonly formatTimestamp = formatTimestamp;

  readonly form = this.fb.nonNullable.group({
    feedId: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0.0001)]],
    unitPrice: [0, [Validators.min(0)]],
    receivedAt: [todayDate(), [Validators.required]],
    supplier: [''],
  });

  constructor() {
    this.feeding.feeds().subscribe({
      next: (feeds) => {
        this.feeds.set(feeds);
        if (feeds.length > 0 && !this.form.controls.feedId.value) {
          this.form.controls.feedId.setValue(feeds[0].id);
          this.loadReceipts(feeds[0].id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  selectFeed(): void {
    const feedId = this.form.controls.feedId.value;
    if (feedId) {
      this.loadReceipts(feedId);
    }
  }

  loadReceipts(feedId: string): void {
    this.feeding.receipts(feedId).subscribe({
      next: (receipts) => this.receipts.set(receipts),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  submit(): void {
    const feedId = this.form.controls.feedId.value;
    if (this.form.invalid || this.saving() || !feedId) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.feeding
      .receiveFeed(feedId, {
        quantity: value.quantity,
        unitPrice: value.unitPrice,
        receivedAt: dateToInstant(value.receivedAt) ?? new Date().toISOString(),
        supplier: value.supplier || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ quantity: 0, unitPrice: 0, supplier: '' });
          this.loadReceipts(feedId);
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
