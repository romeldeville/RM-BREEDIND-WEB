import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Building,
  Farm,
  Pen,
  PenOccupancy,
  ReferentialService,
} from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

interface BuildingPlan {
  building: Building;
  pens: Pen[];
}

@Component({
  selector: 'app-farm-plan-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ 'site.planTitle' | t }}</h1>
          <p>{{ 'site.planSubtitle' | t }}</p>
        </div>
        <label class="field field--inline">
          <span>{{ 'site.farm' | t }}</span>
          <select [value]="selectedFarmId()" (change)="selectFarm($event)">
            @for (farm of farms(); track farm.id) {
              <option [value]="farm.id">{{ farm.name }}</option>
            }
          </select>
        </label>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <p>{{ 'common.loading' | t }}</p>
      } @else if (plan().length === 0) {
        <div class="card panel">
          <p class="muted">{{ 'site.planEmpty' | t }}</p>
        </div>
      } @else {
        <div class="plan">
          @for (entry of plan(); track entry.building.id) {
            <article class="card building">
              <header class="building__header">
                <strong>{{ entry.building.name }}</strong>
                <span class="badge">{{ entry.building.type ?? '—' }}</span>
              </header>
              <div class="pens">
                @for (pen of entry.pens; track pen.id) {
                  <div
                    class="pen"
                    [class.pen--full]="isOvercrowded(pen)"
                    [title]="occupancyLabel(pen)"
                  >
                    <strong>{{ pen.name }}</strong>
                    <small>{{ occupancyLabel(pen) }}</small>
                    <span class="pen__bar">
                      <span
                        class="pen__fill"
                        [style.width.%]="occupancyPercent(pen)"
                      ></span>
                    </span>
                  </div>
                } @empty {
                  <p class="muted">{{ 'site.noPens' | t }}</p>
                }
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        font-size: var(--font-size-sm);
      }
      .field--inline {
        flex-direction: row;
        align-items: center;
        gap: var(--space-2);
      }
      .field select {
        min-height: var(--touch-target);
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }
      .panel {
        padding: var(--space-6);
      }
      .plan {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: var(--space-4);
      }
      .building {
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
      .building__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .badge {
        padding: 2px var(--space-2);
        border-radius: var(--radius-full);
        background: var(--color-border);
        font-size: var(--font-size-xs);
      }
      .pens {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: var(--space-2);
      }
      .pen {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: var(--space-2);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: #f8faf8;
      }
      .pen--full {
        border-color: var(--color-danger);
        background: #fef3f2;
      }
      .pen small,
      .muted {
        color: var(--color-text-muted);
      }
      .pen__bar {
        height: 6px;
        border-radius: var(--radius-full);
        background: var(--color-border);
        overflow: hidden;
      }
      .pen__fill {
        display: block;
        height: 100%;
        background: var(--color-success);
      }
      .pen--full .pen__fill {
        background: var(--color-danger);
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
export class FarmPlanPage {
  private readonly service = inject(ReferentialService);
  private readonly i18n = inject(I18nService);

  readonly farms = signal<Farm[]>([]);
  readonly plan = signal<BuildingPlan[]>([]);
  readonly occupancies = signal<Record<string, PenOccupancy>>({});
  readonly selectedFarmId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadFarms();
  }

  loadFarms(): void {
    this.service.farms().subscribe({
      next: (farms) => {
        this.farms.set(farms);
        if (farms.length > 0) {
          this.selectedFarmId.set(farms[0].id);
          this.loadPlan(farms[0].id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  selectFarm(event: Event): void {
    const farmId = (event.target as HTMLSelectElement).value;
    this.selectedFarmId.set(farmId);
    this.loadPlan(farmId);
  }

  loadPlan(farmId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.buildings(farmId).subscribe({
      next: (buildings) => {
        const entries: BuildingPlan[] = [];
        if (buildings.length === 0) {
          this.plan.set([]);
          this.loading.set(false);
          return;
        }
        let pending = buildings.length;
        for (const building of buildings) {
          this.service.pens(building.id).subscribe({
            next: (pens) => {
              entries.push({ building, pens });
              for (const pen of pens) {
                this.loadOccupancy(pen.id);
              }
              pending -= 1;
              if (pending === 0) {
                this.plan.set(entries);
                this.loading.set(false);
              }
            },
            error: (error: HttpErrorResponse) => {
              this.error.set(this.messageFor(error));
              pending -= 1;
              if (pending === 0) {
                this.plan.set(entries);
                this.loading.set(false);
              }
            },
          });
        }
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  occupancyLabel(pen: Pen): string {
    const occupied = this.occupancies()[pen.id]?.occupied ?? 0;
    return `${occupied} / ${pen.capacity} ${this.i18n.t('site.occupied')}`;
  }

  occupancyPercent(pen: Pen): number {
    if (pen.capacity <= 0) {
      return 0;
    }
    const occupied = this.occupancies()[pen.id]?.occupied ?? 0;
    return Math.min(100, Math.round((occupied / pen.capacity) * 100));
  }

  isOvercrowded(pen: Pen): boolean {
    return this.occupancyPercent(pen) >= 100;
  }

  private loadOccupancy(penId: string): void {
    this.service.occupancy(penId).subscribe({
      next: (occupancy) =>
        this.occupancies.update((map) => ({ ...map, [penId]: occupancy })),
      error: () => undefined,
    });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
