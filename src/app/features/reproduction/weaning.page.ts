import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService } from '../../core/api/herd.service';
import {
  Litter,
  ReproductionCycle,
  ReproductionService,
} from '../../core/api/reproduction.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { REPRODUCTION_STYLES } from './reproduction-page.styles';
import { cycleLabel, dateToInstant, todayDate } from './reproduction-shared';

@Component({
  selector: 'app-weaning-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Sevrage</h1>
          <p>Sevrage d'une portée et effectif sevré.</p>
        </div>
        <a class="btn btn--ghost" routerLink="/app/reproduction">Retour</a>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <form class="card form" [formGroup]="form" (ngSubmit)="save()">
        <h2>Sevrage</h2>
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
            <span>Portée</span>
            <select formControlName="litterId" (change)="onLitter($event)">
              @for (litter of litters(); track litter.id) {
                <option [value]="litter.id">{{ litter.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Date de sevrage</span>
            <input type="date" formControlName="weanedAt" />
          </label>
          <label class="field">
            <span>Nombre sevré</span>
            <input type="number" min="0" step="1" formControlName="count" />
          </label>
          <label class="field">
            <span>Poids moyen (kg)</span>
            <input type="number" min="0" step="0.1" formControlName="averageWeight" />
          </label>
        </div>
        @if (loadingLitters()) {
          <p>Chargement des portées.</p>
        } @else if (litters().length === 0) {
          <p class="empty">Aucune portée pour ce cycle.</p>
        }
        <div class="form-actions">
          <button
            type="submit"
            class="btn btn--primary"
            [disabled]="saving() || litters().length === 0"
          >
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [REPRODUCTION_STYLES],
})
export class WeaningPage {
  private readonly reproduction = inject(ReproductionService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly cycles = signal<ReproductionCycle[]>([]);
  readonly animals = signal<Animal[]>([]);
  readonly litters = signal<Litter[]>([]);
  readonly loadingLitters = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    cycleId: ['', [Validators.required]],
    litterId: ['', [Validators.required]],
    weanedAt: [todayDate(), [Validators.required]],
    count: [0, [Validators.required, Validators.min(0)]],
    averageWeight: [null as number | null],
  });

  constructor() {
    this.herd.animals({ limit: 100 }).subscribe({
      next: (page) => this.animals.set(page.items),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.reproduction.cycles({ limit: 100 }).subscribe({
      next: (page) => {
        this.cycles.set(page.items);
        const requestedCycle = this.route.snapshot.queryParamMap?.get('cycle');
        const requestedLitter = this.route.snapshot.queryParamMap?.get('litter');
        const selected = page.items.find((cycle) => cycle.id === requestedCycle) ?? page.items[0];
        if (selected && !this.form.getRawValue().cycleId) {
          this.form.patchValue({ cycleId: selected.id });
          this.loadLitters(selected.id, requestedLitter);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  onCycle(event: Event): void {
    const cycleId = (event.target as HTMLSelectElement).value;
    this.form.patchValue({ cycleId, litterId: '' });
    this.loadLitters(cycleId);
  }

  onLitter(event: Event): void {
    const litterId = (event.target as HTMLSelectElement).value;
    const litter = this.litters().find((item) => item.id === litterId);
    this.form.patchValue({
      litterId,
      count: litter ? (litter.weanedCount ?? litter.bornAlive) : 0,
    });
  }

  loadLitters(cycleId: string, initialLitterId: string | null = null): void {
    this.loadingLitters.set(true);
    this.litters.set([]);
    this.reproduction.cycle(cycleId).subscribe({
      next: (detail) => {
        this.litters.set(detail.litters);
        const litter =
          detail.litters.find((item) => item.id === initialLitterId) ?? detail.litters[0];
        if (litter) {
          this.form.patchValue({
            litterId: litter.id,
            count: litter.weanedCount ?? litter.bornAlive,
          });
        }
        this.loadingLitters.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loadingLitters.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const weanedAt = dateToInstant(value.weanedAt);
    if (!weanedAt) {
      this.error.set('La date de sevrage est invalide.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.reproduction
      .recordWeaning({
        litterId: value.litterId,
        weanedAt,
        count: value.count,
        averageWeight: value.averageWeight,
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
