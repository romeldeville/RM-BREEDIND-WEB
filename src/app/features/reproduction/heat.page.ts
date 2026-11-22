import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService } from '../../core/api/herd.service';
import { ReproductionService } from '../../core/api/reproduction.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { REPRODUCTION_STYLES } from './reproduction-page.styles';
import { animalLabel, dateToInstant, todayDate } from './reproduction-shared';

@Component({
  selector: 'app-heat-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Chaleurs</h1>
          <p>Détection des chaleurs et prochaine échéance.</p>
        </div>
        <a class="btn btn--ghost" routerLink="/app/reproduction">Retour</a>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <form class="card form" [formGroup]="form" (ngSubmit)="save()">
        <h2>Détection des chaleurs</h2>
        <div class="grid">
          <label class="field">
            <span>Femelle</span>
            <select formControlName="animalId">
              @for (female of females(); track female.id) {
                <option [value]="female.id">{{ label(female) }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Date d'observation</span>
            <input type="date" formControlName="observedAt" />
          </label>
          <label class="field">
            <span>Intensité</span>
            <select formControlName="intensity">
              @for (intensity of intensities; track intensity) {
                <option [value]="intensity">{{ intensity }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Notes</span>
            <textarea rows="3" formControlName="notes"></textarea>
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [REPRODUCTION_STYLES],
})
export class HeatPage {
  private readonly reproduction = inject(ReproductionService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly intensities = ['LOW', 'MEDIUM', 'HIGH'];
  readonly females = signal<Animal[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    animalId: ['', [Validators.required]],
    observedAt: [todayDate(), [Validators.required]],
    intensity: ['MEDIUM'],
    notes: [''],
  });

  constructor() {
    this.herd.animals({ limit: 100 }).subscribe({
      next: (page) => {
        const females = page.items.filter((animal) => animal.sex === 'FEMALE');
        this.females.set(females);
        if (females.length > 0 && !this.form.getRawValue().animalId) {
          this.form.patchValue({ animalId: females[0].id });
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const observedAt = dateToInstant(value.observedAt);
    if (!observedAt) {
      this.error.set("La date d'observation est invalide.");
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.reproduction
      .recordHeat({
        animalId: value.animalId,
        observedAt,
        intensity: value.intensity || null,
        notes: value.notes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/app/reproduction']);
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
