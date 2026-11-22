import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService } from '../../core/api/herd.service';
import {
  CycleDetail,
  Litter,
  ReproductionCycle,
  ReproductionService,
} from '../../core/api/reproduction.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { REPRODUCTION_STYLES } from './reproduction-page.styles';
import { cycleLabel, formatTimestamp } from './reproduction-shared';

@Component({
  selector: 'app-cycle-detail-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Fiche cycle</h1>
          <p>{{ cycle() ? label(cycle()!) : 'Cycle de reproduction' }}</p>
        </div>
        <div class="actions">
          <a class="btn btn--ghost" routerLink="/app/reproduction">Retour</a>
          @if (cycle(); as current) {
            <a class="btn btn--ghost" routerLink="/app/reproduction/heats">Chaleurs</a>
            <a class="btn btn--ghost" routerLink="/app/reproduction/matings">Saillie</a>
            <a
              class="btn btn--ghost"
              [routerLink]="['/app/reproduction/diagnoses']"
              [queryParams]="{ cycle: current.id }"
            >
              Diagnostic
            </a>
            <a
              class="btn btn--ghost"
              [routerLink]="['/app/reproduction/births']"
              [queryParams]="{ cycle: current.id }"
            >
              Mise bas
            </a>
          }
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="card panel"><p>Chargement.</p></div>
      } @else if (detail(); as current) {
        <div class="section-stack">
          <section class="card panel">
            <h2>Cycle</h2>
            <div class="detail-grid">
              <div>
                <span>Femelle</span><strong>{{ label(current.cycle) }}</strong>
              </div>
              <div>
                <span>Statut</span><strong>{{ current.cycle.status }}</strong>
              </div>
              <div>
                <span>Parité</span><strong>{{ current.cycle.parity }}</strong>
              </div>
              <div>
                <span>Début</span><strong>{{ current.cycle.startDate }}</strong>
              </div>
              <div>
                <span>Diagnostic prévu</span>
                <strong>{{ current.cycle.expectedDiagnosisDate ?? '-' }}</strong>
              </div>
              <div>
                <span>Mise bas prévue</span>
                <strong>{{ current.cycle.expectedBirthDate ?? '-' }}</strong>
              </div>
              <div>
                <span>Fin</span><strong>{{ current.cycle.endDate ?? '-' }}</strong>
              </div>
            </div>
          </section>

          <section class="card panel">
            <h2>Chaleurs</h2>
            @if ((current.heats ?? []).length === 0) {
              <p class="empty">Aucune chaleur enregistrée.</p>
            } @else {
              <ul class="event-list">
                @for (heat of current.heats; track heat.id) {
                  <li>
                    <strong>{{ format(heat.observedAt) }}</strong>
                    <span
                      >{{ heat.intensity ?? '-' }} - prochaine:
                      {{ heat.nextExpectedAt ?? '-' }}</span
                    >
                  </li>
                }
              </ul>
            }
          </section>

          <section class="card panel">
            <h2>Saillies</h2>
            @if ((current.matings ?? []).length === 0) {
              <p class="empty">Aucune saillie enregistrée.</p>
            } @else {
              <ul class="event-list">
                @for (mating of current.matings; track mating.id) {
                  <li>
                    <strong>{{ format(mating.matedAt) }}</strong>
                    <span
                      >{{ mating.method ?? '-' }} - mise bas prévue:
                      {{ mating.expectedBirthDate ?? '-' }}</span
                    >
                  </li>
                }
              </ul>
            }
          </section>

          <section class="card panel">
            <h2>Diagnostics</h2>
            @if ((current.diagnoses ?? []).length === 0) {
              <p class="empty">Aucun diagnostic enregistré.</p>
            } @else {
              <ul class="event-list">
                @for (diagnosis of current.diagnoses; track diagnosis.id) {
                  <li>
                    <strong>{{ diagnosis.result }}</strong>
                    <span
                      >{{ format(diagnosis.diagnosedAt) }} - prochain:
                      {{ diagnosis.nextDiagnosisAt ?? '-' }}</span
                    >
                  </li>
                }
              </ul>
            }
          </section>

          <section class="card panel">
            <h2>Mises bas et portées</h2>
            @if ((current.litters ?? []).length === 0) {
              <p class="empty">Aucune portée enregistrée.</p>
            } @else {
              <table class="table">
                <thead>
                  <tr>
                    <th>Portée</th>
                    <th>Nés vivants</th>
                    <th>Sevrés</th>
                    <th>Sevrage</th>
                    <th>Lot</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (litter of current.litters; track litter.id) {
                    <tr>
                      <td>{{ litter.name }}</td>
                      <td>{{ litter.bornAlive }}</td>
                      <td>{{ litter.weanedCount ?? '-' }}</td>
                      <td>{{ litter.weaningDate ?? '-' }}</td>
                      <td>{{ litter.lotId ?? '-' }}</td>
                      <td>
                        <div class="row-actions">
                          <a
                            class="btn btn--ghost"
                            [routerLink]="['/app/reproduction/weanings']"
                            [queryParams]="{ cycle: current.cycle.id, litter: litter.id }"
                          >
                            Sevrage
                          </a>
                          @if (!litter.lotId) {
                            <button
                              type="button"
                              class="btn btn--primary"
                              (click)="openLot(litter)"
                            >
                              Créer un lot
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

          @if (selectedLitter(); as litter) {
            <section class="card panel">
              <h2>Créer un lot depuis {{ litter.name }}</h2>
              <form class="filters" [formGroup]="lotForm" (ngSubmit)="createLot()">
                <label class="field">
                  <span>Nom du lot</span>
                  <input type="text" formControlName="name" />
                </label>
                <label class="field">
                  <span>Code</span>
                  <input type="text" formControlName="code" />
                </label>
                <label class="field">
                  <span>Type de production</span>
                  <input type="text" formControlName="productionType" />
                </label>
                <label class="field">
                  <span>Coût unitaire</span>
                  <input type="number" min="0" step="0.1" formControlName="unitCost" />
                </label>
                <button type="submit" class="btn btn--primary" [disabled]="saving()">
                  {{ saving() ? 'Enregistrement...' : 'Créer le lot' }}
                </button>
                <button type="button" class="btn btn--ghost" (click)="cancelLot()">Annuler</button>
              </form>
            </section>
          }
        </div>
      }
    </section>
  `,
  styles: [REPRODUCTION_STYLES],
})
export class CycleDetailPage {
  private readonly reproduction = inject(ReproductionService);
  private readonly herd = inject(HerdService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly detail = signal<CycleDetail | null>(null);
  readonly animals = signal<Animal[]>([]);
  readonly selectedLitter = signal<Litter | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly lotForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    code: [''],
    productionType: [''],
    unitCost: [null as number | null],
  });

  constructor() {
    this.herd.animals({ limit: 100 }).subscribe({
      next: (page) => this.animals.set(page.items),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.reproduction.cycle(id).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  cycle(): ReproductionCycle | null {
    return this.detail()?.cycle ?? null;
  }

  label(cycle: ReproductionCycle): string {
    return cycleLabel(cycle, this.animals());
  }

  format(value: string | null | undefined): string {
    return formatTimestamp(value);
  }

  openLot(litter: Litter): void {
    this.selectedLitter.set(litter);
    this.lotForm.reset({
      name: `${litter.name} - lot`,
      code: '',
      productionType: '',
      unitCost: null,
    });
  }

  cancelLot(): void {
    this.selectedLitter.set(null);
  }

  createLot(): void {
    const litter = this.selectedLitter();
    if (!litter || this.lotForm.invalid || this.saving()) {
      this.lotForm.markAllAsTouched();
      return;
    }
    const value = this.lotForm.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.reproduction
      .createLotFromLitter(litter.id, {
        name: value.name,
        code: value.code.trim() || null,
        productionType: value.productionType.trim() || null,
        unitCost: value.unitCost,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.selectedLitter.set(null);
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
