import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService } from '../../core/api/herd.service';
import { HealthService, Quarantine } from '../../core/api/health.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { HEALTH_STYLES } from './health-page.styles';
import { animalLabel, normalizeDate, shortId, todayDate } from './health-shared';

@Component({
  selector: 'app-health-quarantine-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Quarantaine</h1>
          <p>Isolement des animaux et libération après la période de quarantaine.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouvelle quarantaine</h2>
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
            <span>Date de début</span>
            <input type="date" formControlName="startDate" />
          </label>
          <label class="field">
            <span>Date de fin prévue</span>
            <input type="date" formControlName="endDate" />
          </label>
          <label class="field">
            <span>Motif</span>
            <input type="text" formControlName="reason" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Quarantaines</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (quarantines().length === 0) {
          <p class="empty">Aucune quarantaine.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Animal</th>
                <th>Statut</th>
                <th>Début</th>
                <th>Fin</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (quarantine of quarantines(); track quarantine.id) {
                <tr>
                  <td>Animal {{ shortId(quarantine.animalId ?? quarantine.lotId) }}</td>
                  <td>{{ quarantine.status }}</td>
                  <td>{{ quarantine.startDate }}</td>
                  <td>{{ quarantine.endDate ?? '-' }}</td>
                  <td>
                    <div class="row-actions">
                      @if (quarantine.status === 'ACTIVE') {
                        <button
                          type="button"
                          class="btn btn--ghost"
                          [disabled]="saving()"
                          (click)="release(quarantine)"
                        >
                          Libérer
                        </button>
                      }
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
export class HealthQuarantinePage {
  private readonly health = inject(HealthService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly animals = signal<Animal[]>([]);
  readonly quarantines = signal<Quarantine[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    animalId: ['', [Validators.required]],
    startDate: [todayDate(), [Validators.required]],
    endDate: [''],
    reason: [''],
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
    this.health.quarantines().subscribe({
      next: (quarantines) => {
        this.quarantines.set(quarantines);
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
      .createQuarantine({
        animalId: value.animalId,
        startDate,
        endDate: normalizeDate(value.endDate),
        reason: value.reason || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ endDate: '', reason: '', startDate: todayDate() });
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  release(quarantine: Quarantine): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.health.releaseQuarantine(quarantine.id).subscribe({
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

  shortId(value: string | null): string {
    return shortId(value);
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
