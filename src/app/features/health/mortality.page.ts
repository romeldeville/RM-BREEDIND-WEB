import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService, Lot } from '../../core/api/herd.service';
import { HealthService, Mortality } from '../../core/api/health.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { HEALTH_STYLES } from './health-page.styles';
import { animalLabel, dateToInstant, formatTimestamp, todayDate } from './health-shared';

@Component({
  selector: 'app-health-mortality-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Mortalité</h1>
          <p>Enregistrement des mortalités par animal ou par lot.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouvelle mortalité</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="save()">
          <label class="field">
            <span>Cible</span>
            <select formControlName="target">
              <option value="ANIMAL">Animal</option>
              <option value="LOT">Lot</option>
            </select>
          </label>
          @if (target() === 'ANIMAL') {
            <label class="field">
              <span>Animal</span>
              <select formControlName="animalId">
                @for (animal of animals(); track animal.id) {
                  <option [value]="animal.id">{{ label(animal) }}</option>
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
            <span>Nombre</span>
            <input type="number" formControlName="count" />
          </label>
          <label class="field">
            <span>Cause</span>
            <input type="text" formControlName="cause" />
          </label>
          <label class="field">
            <span>Date</span>
            <input type="date" formControlName="occurredAt" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Mortalités récentes</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (mortalities().length === 0) {
          <p class="empty">Aucune mortalité enregistrée.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cause</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (mortality of mortalities(); track mortality.id) {
                <tr>
                  <td>{{ mortality.count }}</td>
                  <td>{{ mortality.cause ?? '-' }}</td>
                  <td>{{ format(mortality.occurredAt) }}</td>
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
export class HealthMortalityPage {
  private readonly health = inject(HealthService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly animals = signal<Animal[]>([]);
  readonly lots = signal<Lot[]>([]);
  readonly mortalities = signal<Mortality[]>([]);
  readonly target = signal('ANIMAL');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    target: ['ANIMAL', [Validators.required]],
    animalId: [''],
    lotId: [''],
    count: [1, [Validators.min(1)]],
    cause: [''],
    occurredAt: [todayDate(), [Validators.required]],
  });

  constructor() {
    this.load();
    this.form.controls.target.valueChanges.subscribe((value) => this.target.set(value));
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
    this.herd.lots({ limit: 100 }).subscribe({
      next: (page) => {
        this.lots.set(page.items);
        if (!this.form.getRawValue().lotId && page.items.length > 0) {
          this.form.patchValue({ lotId: page.items[0].id });
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.health.mortalities().subscribe({
      next: (mortalities) => {
        this.mortalities.set(mortalities);
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
    const occurredAt = dateToInstant(value.occurredAt);
    if (!occurredAt) {
      this.error.set('La date est invalide.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.health
      .recordMortality({
        animalId: value.target === 'ANIMAL' ? value.animalId || null : null,
        lotId: value.target === 'LOT' ? value.lotId || null : null,
        count: value.count,
        cause: value.cause || null,
        occurredAt,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ count: 1, cause: '', occurredAt: todayDate() });
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

  format(value: string | null): string {
    return formatTimestamp(value);
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
