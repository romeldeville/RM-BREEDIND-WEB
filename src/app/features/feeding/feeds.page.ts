import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Feed, FeedingService } from '../../core/api/feeding.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FEEDING_STYLES } from './feeding-page.styles';

@Component({
  selector: 'app-feeding-feeds-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Aliments</h1>
          <p>Catalogue des aliments et prix de référence.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouvel aliment</h2>
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
            <span>Unité</span>
            <input type="text" formControlName="unit" />
          </label>
          <label class="field">
            <span>Prix unitaire</span>
            <input type="number" formControlName="price" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Créer l’aliment' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Catalogue</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (feeds().length === 0) {
          <p class="empty">Aucun aliment.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Unité</th>
                <th>Prix</th>
                <th>Fournisseur</th>
              </tr>
            </thead>
            <tbody>
              @for (feed of feeds(); track feed.id) {
                <tr>
                  <td>{{ feed.name }}</td>
                  <td>{{ feed.type ?? '-' }}</td>
                  <td>{{ feed.unit }}</td>
                  <td>{{ feed.price ?? '-' }}</td>
                  <td>{{ feed.supplier ?? '-' }}</td>
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
export class FeedingFeedsPage {
  private readonly feeding = inject(FeedingService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly types = ['CONCENTRATE', 'FORAGE', 'MINERAL', 'ADDITIVE', 'OTHER'];
  readonly feeds = signal<Feed[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    type: ['CONCENTRATE', [Validators.required]],
    unit: ['kg', [Validators.required]],
    price: [0, [Validators.min(0)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.feeding.feeds().subscribe({
      next: (feeds) => {
        this.feeds.set(feeds);
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
    this.feeding.createFeed(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset({ name: '', type: 'CONCENTRATE', unit: 'kg', price: 0 });
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
