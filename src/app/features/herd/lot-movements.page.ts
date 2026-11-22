import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HerdService, Lot, LotMovement } from '../../core/api/herd.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { HERD_STYLES } from './herd-page.styles';

const MOVEMENT_TYPES = [
  'ENTRY',
  'EXIT',
  'MORTALITY',
  'SALE',
  'TRANSFER',
  'ADJUSTMENT',
  'INDIVIDUALIZATION',
];

@Component({
  selector: 'app-lot-movements-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ 'lot.movementTitle' | t }}</h1>
          <p>{{ lot()?.name ?? '' }}</p>
        </div>
        <div class="actions">
          @if (lot(); as current) {
            <a class="btn btn--ghost" [routerLink]="['/app/lots', current.id]">
              {{ 'ref.back' | t }}
            </a>
          }
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <form class="card form" [formGroup]="form" (ngSubmit)="addMovement()">
        <h2>{{ 'lot.addMovement' | t }}</h2>
        <div class="grid">
          <label class="field">
            <span>{{ 'lot.movementType' | t }}</span>
            <select formControlName="type">
              @for (type of movementTypes; track type) {
                <option [value]="type">{{ type }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'lot.quantity' | t }}</span>
            <input type="number" min="1" formControlName="quantity" />
          </label>
          <label class="field">
            <span>{{ 'lot.occurredAt' | t }}</span>
            <input type="datetime-local" formControlName="occurredAt" />
          </label>
          <label class="field">
            <span>{{ 'herd.reason' | t }}</span>
            <input type="text" formControlName="reason" autocomplete="off" />
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ 'lot.addMovement' | t }}
          </button>
        </div>
      </form>

      <section class="card panel">
        <h2>{{ 'herd.history' | t }}</h2>
        @if (movements().length === 0) {
          <p class="muted">{{ 'common.empty' | t }}</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>{{ 'lot.movementType' | t }}</th>
                <th>{{ 'lot.quantity' | t }}</th>
                <th>{{ 'lot.occurredAt' | t }}</th>
                <th>{{ 'herd.reason' | t }}</th>
              </tr>
            </thead>
            <tbody>
              @for (movement of movements(); track movement.id) {
                <tr>
                  <td><span class="badge">{{ movement.type }}</span></td>
                  <td>{{ movement.quantity }}</td>
                  <td>{{ movement.occurredAt }}</td>
                  <td>{{ movement.reason ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [HERD_STYLES],
})
export class LotMovementsPage {
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  readonly movementTypes = MOVEMENT_TYPES;
  readonly lot = signal<Lot | null>(null);
  readonly movements = signal<LotMovement[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    type: ['ENTRY', [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    occurredAt: [this.defaultOccurredAt(), [Validators.required]],
    reason: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.herd.lot(id).subscribe({
      next: (lot) => this.lot.set(lot),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.herd.lotMovements(id).subscribe({
      next: (items) => this.movements.set(items),
      error: () => this.movements.set([]),
    });
  }

  addMovement(): void {
    const id = this.lot()?.id;
    if (!id || this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const occurredAt = new Date(value.occurredAt);
    this.saving.set(true);
    this.error.set(null);
    this.herd
      .moveLot(id, {
        type: value.type,
        quantity: value.quantity,
        occurredAt: Number.isNaN(occurredAt.getTime())
          ? new Date().toISOString()
          : occurredAt.toISOString(),
        reason: value.reason || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ quantity: 1, reason: '' });
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  private defaultOccurredAt(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
