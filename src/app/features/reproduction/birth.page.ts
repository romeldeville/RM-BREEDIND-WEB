import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService } from '../../core/api/herd.service';
import {
  BirthCreation,
  ReproductionCycle,
  ReproductionService,
} from '../../core/api/reproduction.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { REPRODUCTION_STYLES } from './reproduction-page.styles';
import { cycleLabel, dateToInstant, todayDate } from './reproduction-shared';

@Component({
  selector: 'app-birth-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Mise bas</h1>
          <p>Enregistrement de la portée et des nouveau-nés.</p>
        </div>
        <a class="btn btn--ghost" routerLink="/app/reproduction">Retour</a>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      @if (result(); as current) {
        <section class="card panel">
          <h2>Résultat</h2>
          <div class="detail-grid">
            <div>
              <span>Portée</span><strong>{{ current.litterId }}</strong>
            </div>
            @if (current.retroactiveMatingSuggested) {
              <div>
                <span>Saillie suggérée</span>
                <strong>{{ current.suggestedMatingDate ?? '-' }}</strong>
              </div>
            }
          </div>
          <a
            class="btn btn--primary"
            [routerLink]="['/app/reproduction/cycles', current.birth.cycleId]"
          >
            Voir le cycle
          </a>
        </section>
      }

      <form class="card form" [formGroup]="form" (ngSubmit)="save()">
        <h2>Mise bas</h2>
        <div class="grid">
          <label class="field">
            <span>Cycle</span>
            <select formControlName="cycleId" (change)="onCycle($event)">
              @for (cycle of cycles(); track cycle.id) {
                <option [value]="cycle.id">{{ label(cycle) }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Date de mise bas</span>
            <input type="date" formControlName="occurredAt" />
          </label>
          <label class="field">
            <span>Nés vivants</span>
            <input type="number" min="0" step="1" formControlName="bornAlive" />
          </label>
          <label class="field">
            <span>Mort-nés</span>
            <input type="number" min="0" step="1" formControlName="stillborn" />
          </label>
          <label class="field">
            <span>Momifiés</span>
            <input type="number" min="0" step="1" formControlName="mummified" />
          </label>
          <label class="field">
            <span>Poids de portée (kg)</span>
            <input type="number" min="0" step="0.1" formControlName="litterWeight" />
          </label>
          <label class="field">
            <span>Assistance</span>
            <input type="checkbox" formControlName="assistance" />
          </label>
          <label class="field">
            <span>Complications</span>
            <textarea rows="3" formControlName="complications"></textarea>
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
export class BirthPage {
  private readonly reproduction = inject(ReproductionService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  readonly cycles = signal<ReproductionCycle[]>([]);
  readonly animals = signal<Animal[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<BirthCreation | null>(null);

  readonly form = this.fb.nonNullable.group({
    cycleId: ['', [Validators.required]],
    femaleId: ['', [Validators.required]],
    occurredAt: [todayDate(), [Validators.required]],
    bornAlive: [1, [Validators.required, Validators.min(0)]],
    stillborn: [0, [Validators.min(0)]],
    mummified: [0, [Validators.min(0)]],
    litterWeight: [null as number | null],
    assistance: [false],
    complications: [''],
  });

  constructor() {
    this.herd.animals({ limit: 100 }).subscribe({
      next: (page) => this.animals.set(page.items),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.reproduction.cycles({ limit: 100 }).subscribe({
      next: (page) => {
        this.cycles.set(page.items);
        const requested = this.route.snapshot.queryParamMap?.get('cycle');
        const selected = page.items.find((cycle) => cycle.id === requested) ?? page.items[0];
        if (selected && !this.form.getRawValue().cycleId) {
          this.form.patchValue({ cycleId: selected.id, femaleId: selected.femaleId });
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  onCycle(event: Event): void {
    const cycleId = (event.target as HTMLSelectElement).value;
    const cycle = this.cycles().find((item) => item.id === cycleId);
    this.form.patchValue({ cycleId, femaleId: cycle?.femaleId ?? '' });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const occurredAt = dateToInstant(value.occurredAt);
    if (!occurredAt) {
      this.error.set('La date de mise bas est invalide.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.reproduction
      .recordBirth({
        cycleId: value.cycleId,
        femaleId: value.femaleId,
        occurredAt,
        bornAlive: value.bornAlive,
        stillborn: value.stillborn,
        mummified: value.mummified,
        litterWeight: value.litterWeight,
        assistance: value.assistance,
        complications: value.complications.trim() || null,
      })
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.result.set(result);
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  label(cycle: ReproductionCycle): string {
    return cycleLabel(cycle, this.animals());
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
