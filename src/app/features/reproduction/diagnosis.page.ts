import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService } from '../../core/api/herd.service';
import { ReproductionCycle, ReproductionService } from '../../core/api/reproduction.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { REPRODUCTION_STYLES } from './reproduction-page.styles';
import { cycleLabel, dateToInstant, todayDate } from './reproduction-shared';

@Component({
  selector: 'app-diagnosis-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Diagnostic de gestation</h1>
          <p>Résultat du diagnostic et prochaine échéance.</p>
        </div>
        <a class="btn btn--ghost" routerLink="/app/reproduction">Retour</a>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <form class="card form" [formGroup]="form" (ngSubmit)="save()">
        <h2>Diagnostic</h2>
        <div class="grid">
          <label class="field">
            <span>Cycle</span>
            <select formControlName="cycleId">
              @for (cycle of cycles(); track cycle.id) {
                <option [value]="cycle.id">{{ label(cycle) }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Date du diagnostic</span>
            <input type="date" formControlName="diagnosedAt" />
          </label>
          <label class="field">
            <span>Résultat</span>
            <select formControlName="result">
              @for (result of results; track result) {
                <option [value]="result">{{ result }}</option>
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
export class DiagnosisPage {
  private readonly reproduction = inject(ReproductionService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly results = ['POSITIVE', 'NEGATIVE', 'UNCERTAIN'];
  readonly cycles = signal<ReproductionCycle[]>([]);
  readonly animals = signal<Animal[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    cycleId: ['', [Validators.required]],
    diagnosedAt: [todayDate(), [Validators.required]],
    result: ['POSITIVE', [Validators.required]],
    notes: [''],
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
          this.form.patchValue({ cycleId: selected.id });
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
    const diagnosedAt = dateToInstant(value.diagnosedAt);
    if (!diagnosedAt) {
      this.error.set('La date du diagnostic est invalide.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.reproduction
      .recordDiagnosis({
        cycleId: value.cycleId,
        diagnosedAt,
        result: value.result,
        notes: value.notes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/app/reproduction/cycles', value.cycleId]);
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
