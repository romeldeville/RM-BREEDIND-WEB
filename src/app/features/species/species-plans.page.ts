import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FeedingPlan,
  ReferentialService,
  VaccinationPlan,
} from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-species-plans-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ 'ref.plansTitle' | t }}</h1>
          <p>{{ 'ref.plansSubtitle' | t }}</p>
        </div>
        <a class="btn btn--ghost" routerLink="/app/species">{{ 'ref.back' | t }}</a>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card form">
        <h2>{{ 'ref.vaccination' | t }}</h2>
        <form class="grid" [formGroup]="vaccinationForm" (ngSubmit)="addVaccination()">
          <label class="field">
            <span>{{ 'ref.planName' | t }}</span>
            <input type="text" formControlName="name" autocomplete="off" />
          </label>
          <label class="field">
            <span>{{ 'ref.ageDays' | t }}</span>
            <input type="number" min="0" formControlName="ageDays" />
          </label>
          <label class="field">
            <span>{{ 'ref.boosterDays' | t }}</span>
            <input type="number" min="0" formControlName="boosterDays" />
          </label>
          <div class="form-actions">
            <button type="submit" class="btn btn--primary" [disabled]="savingVaccination()">
              {{ 'ref.addPlan' | t }}
            </button>
          </div>
        </form>
        <ul class="list">
          @for (plan of vaccinationPlans(); track plan.id) {
            <li class="list__item">
              <div>
                <strong>{{ plan.name }}</strong>
                <small>
                  {{ plan.ageDays ?? '—' }} j
                  @if (plan.boosterDays) {
                    · rappel {{ plan.boosterDays }} j
                  }
                </small>
              </div>
              <button type="button" class="btn btn--ghost" (click)="removeVaccination(plan)">
                {{ 'ref.delete' | t }}
              </button>
            </li>
          } @empty {
            <li class="muted">{{ 'common.empty' | t }}</li>
          }
        </ul>
      </section>

      <section class="card form">
        <h2>{{ 'ref.feeding' | t }}</h2>
        <form class="grid" [formGroup]="feedingForm" (ngSubmit)="addFeeding()">
          <label class="field">
            <span>{{ 'ref.planName' | t }}</span>
            <input type="text" formControlName="name" autocomplete="off" />
          </label>
          <label class="field field--wide">
            <span>{{ 'ref.stages' | t }}</span>
            <textarea rows="3" formControlName="stages"></textarea>
            <small>{{ 'ref.stagesHint' | t }}</small>
          </label>
          <div class="form-actions">
            <button type="submit" class="btn btn--primary" [disabled]="savingFeeding()">
              {{ 'ref.addPlan' | t }}
            </button>
          </div>
        </form>
        <ul class="list">
          @for (plan of feedingPlans(); track plan.id) {
            <li class="list__item">
              <div>
                <strong>{{ plan.name }}</strong>
                <small>{{ plan.stages.length }} {{ 'ref.stagesCount' | t }}</small>
              </div>
              <button type="button" class="btn btn--ghost" (click)="removeFeeding(plan)">
                {{ 'ref.delete' | t }}
              </button>
            </li>
          } @empty {
            <li class="muted">{{ 'common.empty' | t }}</li>
          }
        </ul>
      </section>
    </section>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-6);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        align-items: end;
        gap: var(--space-4);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        font-size: var(--font-size-sm);
      }
      .field--wide {
        grid-column: span 2;
      }
      .field input,
      .field textarea {
        min-height: var(--touch-target);
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }
      .field small,
      .muted {
        color: var(--color-text-muted);
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
      }
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .list__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
      }
      .list__item small {
        display: block;
        color: var(--color-text-muted);
      }
      .error {
        padding: var(--space-3);
        border-radius: var(--radius-md);
        background: #fef3f2;
        color: var(--color-danger);
      }
    `,
  ],
})
export class SpeciesPlansPage {
  private readonly service = inject(ReferentialService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  readonly speciesId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly vaccinationPlans = signal<VaccinationPlan[]>([]);
  readonly feedingPlans = signal<FeedingPlan[]>([]);
  readonly savingVaccination = signal(false);
  readonly savingFeeding = signal(false);
  readonly error = signal<string | null>(null);

  readonly vaccinationForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    ageDays: [null as number | null],
    boosterDays: [null as number | null],
  });

  readonly feedingForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    stages: ['[]'],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.service.vaccinationPlans(this.speciesId).subscribe({
      next: (items) => this.vaccinationPlans.set(items),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.service.feedingPlans(this.speciesId).subscribe({
      next: (items) => this.feedingPlans.set(items),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  addVaccination(): void {
    if (this.vaccinationForm.invalid || this.savingVaccination()) {
      this.vaccinationForm.markAllAsTouched();
      return;
    }
    this.savingVaccination.set(true);
    this.service
      .createVaccinationPlan(this.speciesId, this.vaccinationForm.getRawValue())
      .subscribe({
        next: (plan) => {
          this.savingVaccination.set(false);
          this.vaccinationPlans.update((items) => [...items, plan]);
          this.vaccinationForm.reset({ name: '', ageDays: null, boosterDays: null });
        },
        error: (error: HttpErrorResponse) => {
          this.savingVaccination.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  addFeeding(): void {
    if (this.feedingForm.invalid || this.savingFeeding()) {
      this.feedingForm.markAllAsTouched();
      return;
    }
    const stages = this.parseStages();
    if (stages === undefined) {
      return;
    }
    this.savingFeeding.set(true);
    this.service
      .createFeedingPlan(this.speciesId, {
        name: this.feedingForm.getRawValue().name,
        stages,
      })
      .subscribe({
        next: (plan) => {
          this.savingFeeding.set(false);
          this.feedingPlans.update((items) => [...items, plan]);
          this.feedingForm.reset({ name: '', stages: '[]' });
        },
        error: (error: HttpErrorResponse) => {
          this.savingFeeding.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  removeVaccination(plan: VaccinationPlan): void {
    this.service.deleteVaccinationPlan(plan.id).subscribe({
      next: () =>
        this.vaccinationPlans.update((items) => items.filter((i) => i.id !== plan.id)),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  removeFeeding(plan: FeedingPlan): void {
    this.service.deleteFeedingPlan(plan.id).subscribe({
      next: () => this.feedingPlans.update((items) => items.filter((i) => i.id !== plan.id)),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  private parseStages(): Record<string, unknown>[] | undefined {
    const raw = this.feedingForm.getRawValue().stages.trim();
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('invalid');
      }
      return parsed as Record<string, unknown>[];
    } catch {
      this.error.set(this.i18n.t('ref.invalidJsonArray'));
      return undefined;
    }
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
