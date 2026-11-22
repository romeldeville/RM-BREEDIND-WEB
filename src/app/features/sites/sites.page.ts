import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-sites-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ 'site.title' | t }}</h1>
          <p>{{ 'site.subtitle' | t }}</p>
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

      @if (farms().length === 0) {
        <div class="card panel">
          <p class="muted">{{ 'site.noFarm' | t }}</p>
        </div>
      } @else {
        <div class="layout">
          <section class="card panel">
            <h2>{{ 'site.buildings' | t }}</h2>
            <form class="inline-form" [formGroup]="buildingForm" (ngSubmit)="addBuilding()">
              <label class="field">
                <span>{{ 'site.buildingName' | t }}</span>
                <input type="text" formControlName="name" autocomplete="off" />
              </label>
              <label class="field field--short">
                <span>{{ 'site.type' | t }}</span>
                <input type="text" formControlName="type" autocomplete="off" />
              </label>
              <button type="submit" class="btn btn--primary" [disabled]="savingBuilding()">
                {{ 'site.add' | t }}
              </button>
            </form>
            <ul class="list">
              @for (building of buildings(); track building.id) {
                <li
                  class="list__item"
                  [class.list__item--active]="building.id === selectedBuildingId()"
                >
                  <button type="button" class="link" (click)="selectBuilding(building)">
                    <strong>{{ building.name }}</strong>
                    <small>{{ building.type ?? '—' }}</small>
                  </button>
                  <button type="button" class="btn btn--ghost" (click)="archiveBuilding(building)">
                    {{ 'ref.archive' | t }}
                  </button>
                </li>
              } @empty {
                <li class="muted">{{ 'common.empty' | t }}</li>
              }
            </ul>
          </section>

          <section class="card panel">
            <h2>{{ 'site.pens' | t }}</h2>
            @if (!selectedBuildingId()) {
              <p class="muted">{{ 'site.noBuilding' | t }}</p>
            } @else {
              <form class="inline-form" [formGroup]="penForm" (ngSubmit)="addPen()">
                <label class="field">
                  <span>{{ 'site.penName' | t }}</span>
                  <input type="text" formControlName="name" autocomplete="off" />
                </label>
                <label class="field field--short">
                  <span>{{ 'site.capacity' | t }}</span>
                  <input type="number" min="0" formControlName="capacity" />
                </label>
                <button type="submit" class="btn btn--primary" [disabled]="savingPen()">
                  {{ 'site.add' | t }}
                </button>
              </form>
              <ul class="list">
                @for (pen of pens(); track pen.id) {
                  <li class="list__item">
                    <div>
                      <strong>{{ pen.name }}</strong>
                      <small>{{ occupancyLabel(pen) }}</small>
                    </div>
                    <div class="occupancy">
                      <span
                        class="occupancy__bar"
                        [class.occupancy__bar--full]="isOvercrowded(pen)"
                        [style.width.%]="occupancyPercent(pen)"
                      ></span>
                    </div>
                    <button type="button" class="btn btn--ghost" (click)="archivePen(pen)">
                      {{ 'ref.archive' | t }}
                    </button>
                  </li>
                } @empty {
                  <li class="muted">{{ 'common.empty' | t }}</li>
                }
              </ul>
            }
          </section>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .layout {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: var(--space-4);
      }
      .panel {
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
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
      .field--short {
        max-width: 120px;
      }
      .field input,
      .field select {
        min-height: var(--touch-target);
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }
      .inline-form {
        display: flex;
        align-items: flex-end;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      .inline-form .field {
        flex: 1;
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
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
      }
      .list__item--active {
        border-color: var(--color-primary);
      }
      .link {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        text-align: left;
        color: inherit;
      }
      .link small,
      .muted {
        color: var(--color-text-muted);
      }
      .occupancy {
        flex: 1;
        height: 8px;
        border-radius: var(--radius-full);
        background: var(--color-border);
        overflow: hidden;
        min-width: 60px;
      }
      .occupancy__bar {
        display: block;
        height: 100%;
        background: var(--color-success);
      }
      .occupancy__bar--full {
        background: var(--color-danger);
      }
      .list__item .btn {
        min-height: 36px;
        padding: 0 var(--space-3);
        font-size: var(--font-size-xs);
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
export class SitesPage {
  private readonly service = inject(ReferentialService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly farms = signal<Farm[]>([]);
  readonly buildings = signal<Building[]>([]);
  readonly pens = signal<Pen[]>([]);
  readonly occupancies = signal<Record<string, PenOccupancy>>({});
  readonly selectedFarmId = signal<string | null>(null);
  readonly selectedBuildingId = signal<string | null>(null);
  readonly savingBuilding = signal(false);
  readonly savingPen = signal(false);
  readonly error = signal<string | null>(null);

  readonly buildingForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    type: [''],
  });

  readonly penForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    capacity: [0, [Validators.min(0)]],
  });

  constructor() {
    this.loadFarms();
  }

  loadFarms(): void {
    this.service.farms().subscribe({
      next: (farms) => {
        this.farms.set(farms);
        if (farms.length > 0) {
          this.selectedFarmId.set(farms[0].id);
          this.loadBuildings(farms[0].id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  selectFarm(event: Event): void {
    const farmId = (event.target as HTMLSelectElement).value;
    this.selectedFarmId.set(farmId);
    this.selectedBuildingId.set(null);
    this.pens.set([]);
    this.loadBuildings(farmId);
  }

  loadBuildings(farmId: string): void {
    this.service.buildings(farmId).subscribe({
      next: (items) => {
        this.buildings.set(items);
        if (items.length > 0) {
          this.selectBuilding(items[0]);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  selectBuilding(building: Building): void {
    this.selectedBuildingId.set(building.id);
    this.service.pens(building.id).subscribe({
      next: (items) => {
        this.pens.set(items);
        for (const pen of items) {
          this.loadOccupancy(pen.id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  addBuilding(): void {
    const farmId = this.selectedFarmId();
    if (!farmId || this.buildingForm.invalid || this.savingBuilding()) {
      return;
    }
    this.savingBuilding.set(true);
    const value = this.buildingForm.getRawValue();
    this.service
      .createBuilding({ farmId, name: value.name, type: value.type || null })
      .subscribe({
        next: (building) => {
          this.savingBuilding.set(false);
          this.buildingForm.reset({ name: '', type: '' });
          this.buildings.update((items) => [...items, building]);
          this.selectBuilding(building);
        },
        error: (error: HttpErrorResponse) => {
          this.savingBuilding.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  addPen(): void {
    const buildingId = this.selectedBuildingId();
    if (!buildingId || this.penForm.invalid || this.savingPen()) {
      return;
    }
    this.savingPen.set(true);
    const value = this.penForm.getRawValue();
    this.service.createPen({ buildingId, name: value.name, capacity: value.capacity }).subscribe({
      next: (pen) => {
        this.savingPen.set(false);
        this.penForm.reset({ name: '', capacity: 0 });
        this.pens.update((items) => [...items, pen]);
        this.loadOccupancy(pen.id);
      },
      error: (error: HttpErrorResponse) => {
        this.savingPen.set(false);
        this.error.set(this.messageFor(error));
      },
    });
  }

  archiveBuilding(building: Building): void {
    this.service.archiveBuilding(building.id).subscribe({
      next: () => {
        this.buildings.update((items) => items.filter((i) => i.id !== building.id));
        if (this.selectedBuildingId() === building.id) {
          this.selectedBuildingId.set(null);
          this.pens.set([]);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  archivePen(pen: Pen): void {
    this.service.archivePen(pen.id).subscribe({
      next: () => this.pens.update((items) => items.filter((i) => i.id !== pen.id)),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  occupancyLabel(pen: Pen): string {
    const occupancy = this.occupancies()[pen.id];
    const occupied = occupancy?.occupied ?? 0;
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
