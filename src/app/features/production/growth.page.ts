import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService, Lot } from '../../core/api/herd.service';
import { Gmq, GrowthCurve, ProductionService } from '../../core/api/production.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PRODUCTION_STYLES } from './production-page.styles';
import { formatQuantity, formatTimestamp } from './production-shared';

@Component({
  selector: 'app-production-growth-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Courbe de croissance</h1>
          <p>Gain moyen quotidien et points de croissance.</p>
        </div>
      </header>

      <section class="card panel">
        <h2>Cible</h2>
        <form class="filters" [formGroup]="form">
          <label class="field">
            <span>Cible</span>
            <select formControlName="target">
              <option value="ANIMAL">Animal</option>
              <option value="LOT">Lot</option>
            </select>
          </label>
          @if (form.controls.target.value === 'ANIMAL') {
            <label class="field">
              <span>Animal</span>
              <select formControlName="animalId">
                @for (animal of animals(); track animal.id) {
                  <option [value]="animal.id">{{ animalLabel(animal) }}</option>
                }
              </select>
            </label>
          } @else {
            <label class="field">
              <span>Lot</span>
              <select formControlName="lotId">
                @for (lot of lots(); track lot.id) {
                  <option [value]="lot.id">{{ lot.name }}</option>
                }
              </select>
            </label>
          }
        </form>
      </section>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Gain moyen quotidien</h2>
        @if (!gmq()) {
          <p class="empty">GMQ indisponible (au moins deux pesées requises).</p>
        } @else {
          <p>
            <strong>{{ formatQuantity(gmq()!.gmq) }} kg/jour</strong> —
            {{ formatQuantity(gmq()!.startWeightKg) }} kg → {{ formatQuantity(gmq()!.endWeightKg) }} kg
            sur {{ gmq()!.days }} jour(s).
          </p>
        }
      </section>

      <section class="card panel">
        <h2>Points de croissance</h2>
        @if (curve()?.points?.length === 0) {
          <p class="empty">Aucune pesée.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Poids</th>
                <th>Date</th>
                <th>Âge (jours)</th>
              </tr>
            </thead>
            <tbody>
              @for (point of curve()?.points ?? []; track point.weighedAt) {
                <tr>
                  <td>{{ formatQuantity(point.weightKg) }} kg</td>
                  <td>{{ formatTimestamp(point.weighedAt) }}</td>
                  <td>{{ point.ageDays ?? '-' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [PRODUCTION_STYLES],
})
export class ProductionGrowthPage {
  private readonly production = inject(ProductionService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly animals = signal<Animal[]>([]);
  readonly lots = signal<Lot[]>([]);
  readonly gmq = signal<Gmq | null>(null);
  readonly curve = signal<GrowthCurve | null>(null);
  readonly error = signal<string | null>(null);

  readonly formatQuantity = formatQuantity;
  readonly formatTimestamp = formatTimestamp;
  readonly animalLabel = (animal: Animal): string =>
    animal.name ? `${animal.identifier} - ${animal.name}` : animal.identifier;

  readonly form = this.fb.nonNullable.group({
    target: ['ANIMAL'],
    animalId: [''],
    lotId: [''],
  });

  constructor() {
    this.herd.animals({ limit: 100 }).subscribe({
      next: (page) => {
        this.animals.set(page.items);
        if (page.items.length > 0 && !this.form.controls.animalId.value) {
          this.form.controls.animalId.setValue(page.items[0].id);
          this.load();
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.herd.lots({ limit: 100 }).subscribe({
      next: (page) => {
        this.lots.set(page.items);
        if (page.items.length > 0 && !this.form.controls.lotId.value) {
          this.form.controls.lotId.setValue(page.items[0].id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.form.valueChanges.subscribe(() => this.load());
    this.load();
  }

  load(): void {
    const value = this.form.getRawValue();
    const query: Record<string, unknown> = {};
    if (value.target === 'ANIMAL' && value.animalId) {
      query['animalId'] = value.animalId;
    } else if (value.target === 'LOT' && value.lotId) {
      query['lotId'] = value.lotId;
    } else {
      return;
    }
    this.error.set(null);
    this.gmq.set(null);
    this.production.gmq(query).subscribe({
      next: (gmq) => this.gmq.set(gmq),
      error: () => this.gmq.set(null),
    });
    this.production.growthCurve(query).subscribe({
      next: (curve) => this.curve.set(curve),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
