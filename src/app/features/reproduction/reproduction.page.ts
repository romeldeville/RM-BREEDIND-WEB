import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService } from '../../core/api/herd.service';
import { ReproductionCycle, ReproductionService } from '../../core/api/reproduction.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { REPRODUCTION_STYLES } from './reproduction-page.styles';
import { animalLabel, cycleLabel, dateToInstant, todayDate } from './reproduction-shared';

@Component({
  selector: 'app-reproduction-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Reproduction</h1>
          <p>Chaleurs, saillies, gestations, mises bas et sevrages.</p>
        </div>
        <div class="actions">
          <a class="btn btn--ghost" routerLink="/app/reproduction/heats">Chaleurs</a>
          <a class="btn btn--ghost" routerLink="/app/reproduction/matings">Saillie</a>
          <a class="btn btn--ghost" routerLink="/app/reproduction/diagnoses">Diagnostic</a>
          <a class="btn btn--ghost" routerLink="/app/reproduction/births">Mise bas</a>
          <a class="btn btn--ghost" routerLink="/app/reproduction/weanings">Sevrage</a>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouveau cycle</h2>
        <form class="filters" [formGroup]="form" (ngSubmit)="create()">
          <label class="field">
            <span>Femelle</span>
            <select formControlName="femaleId">
              @for (female of females(); track female.id) {
                <option [value]="female.id">{{ label(female) }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Date de début</span>
            <input type="date" formControlName="startDate" />
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Créer le cycle' }}
          </button>
        </form>
      </section>

      <section class="card panel">
        <h2>Cycles de reproduction</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (cycles().length === 0) {
          <p class="empty">Aucun cycle de reproduction.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Femelle</th>
                <th>Statut</th>
                <th>Parité</th>
                <th>Début</th>
                <th>Diagnostic prévu</th>
                <th>Mise bas prévue</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (cycle of cycles(); track cycle.id) {
                <tr>
                  <td>{{ cycleLabel(cycle) }}</td>
                  <td>{{ cycle.status }}</td>
                  <td>{{ cycle.parity }}</td>
                  <td>{{ cycle.startDate }}</td>
                  <td>{{ cycle.expectedDiagnosisDate ?? '-' }}</td>
                  <td>{{ cycle.expectedBirthDate ?? '-' }}</td>
                  <td>
                    <div class="row-actions">
                      <a
                        class="btn btn--ghost"
                        [routerLink]="['/app/reproduction/cycles', cycle.id]"
                      >
                        Fiche
                      </a>
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
  styles: [REPRODUCTION_STYLES],
})
export class ReproductionPage {
  private readonly reproduction = inject(ReproductionService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly cycles = signal<ReproductionCycle[]>([]);
  readonly animals = signal<Animal[]>([]);
  readonly females = computed(() => this.animals().filter((animal) => animal.sex === 'FEMALE'));
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    femaleId: ['', [Validators.required]],
    startDate: [todayDate(), [Validators.required]],
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
        if (!this.form.getRawValue().femaleId) {
          const female = page.items.find((animal) => animal.sex === 'FEMALE');
          if (female) {
            this.form.patchValue({ femaleId: female.id });
          }
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.reproduction.cycles({ limit: 100 }).subscribe({
      next: (page) => {
        this.cycles.set(page.items);
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
    const value = this.form.getRawValue();
    const startDate = dateToInstant(value.startDate);
    if (!startDate) {
      this.error.set('La date de début est invalide.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.reproduction
      .createCycle({ femaleId: value.femaleId, startDate: value.startDate })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.patchValue({ startDate: todayDate() });
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

  cycleLabel(cycle: ReproductionCycle): string {
    return cycleLabel(cycle, this.animals());
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
