import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HerdService, Animal } from '../../core/api/herd.service';
import { ReferentialService, Species } from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { HERD_STYLES } from './herd-page.styles';

const STATUSES = ['ACTIVE', 'QUARANTINED', 'SOLD', 'DEAD', 'SLAUGHTERED', 'TRANSFERRED', 'ARCHIVED'];

@Component({
  selector: 'app-animal-list-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ 'herd.title' | t }}</h1>
          <p>{{ 'herd.subtitle' | t }}</p>
        </div>
        <div class="actions">
          <a class="btn btn--ghost" routerLink="/app/lots">{{ 'herd.lots' | t }}</a>
          <a class="btn btn--primary" routerLink="/app/herd/new">{{ 'herd.newAnimal' | t }}</a>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <div class="card panel">
        <div class="filters">
          <label class="field">
            <span>{{ 'herd.search' | t }}</span>
            <input
              type="search"
              [value]="search()"
              (input)="onSearch($event)"
              [placeholder]="'herd.searchPlaceholder' | t"
            />
          </label>
          <label class="field">
            <span>{{ 'herd.status' | t }}</span>
            <select [value]="status()" (change)="onStatus($event)">
              <option value="">{{ 'herd.allStatuses' | t }}</option>
              @for (item of statuses; track item) {
                <option [value]="item">{{ item }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'herd.species' | t }}</span>
            <select [value]="speciesId()" (change)="onSpecies($event)">
              <option value="">{{ 'herd.allSpecies' | t }}</option>
              @for (item of species(); track item.id) {
                <option [value]="item.id">{{ item.name }}</option>
              }
            </select>
          </label>
        </div>

        @if (loading()) {
          <p>{{ 'common.loading' | t }}</p>
        } @else if (animals().length === 0) {
          <p class="muted">{{ 'common.empty' | t }}</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>{{ 'herd.identifier' | t }}</th>
                <th>{{ 'herd.name' | t }}</th>
                <th>{{ 'herd.species' | t }}</th>
                <th>{{ 'herd.sex' | t }}</th>
                <th>{{ 'herd.status' | t }}</th>
                <th>{{ 'herd.birthDate' | t }}</th>
                <th>{{ 'herd.weight' | t }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (animal of animals(); track animal.id) {
                <tr>
                  <td><strong>{{ animal.identifier }}</strong></td>
                  <td>{{ animal.name ?? '—' }}</td>
                  <td>{{ speciesName(animal.speciesId) }}</td>
                  <td>{{ animal.sex }}</td>
                  <td><span class="badge">{{ animal.status }}</span></td>
                  <td>{{ animal.birthDate ?? '—' }}</td>
                  <td>{{ animal.weightKg ?? '—' }}</td>
                  <td class="row-actions">
                    <a class="btn btn--ghost" [routerLink]="['/app/herd', animal.id]">
                      {{ 'herd.detail' | t }}
                    </a>
                    <a class="btn btn--ghost" [routerLink]="['/app/herd', animal.id, 'edit']">
                      {{ 'ref.edit' | t }}
                    </a>
                    <a class="btn btn--ghost" [routerLink]="['/app/herd', animal.id, 'status']">
                      {{ 'herd.statusFiliation' | t }}
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </section>
  `,
  styles: [HERD_STYLES],
})
export class AnimalListPage {
  private readonly herd = inject(HerdService);
  private readonly referential = inject(ReferentialService);
  private readonly i18n = inject(I18nService);

  readonly statuses = STATUSES;
  readonly animals = signal<Animal[]>([]);
  readonly species = signal<Species[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly status = signal('');
  readonly speciesId = signal('');

  constructor() {
    this.referential.species().subscribe({
      next: (items) => this.species.set(items),
      error: () => this.species.set([]),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.herd
      .animals({
        search: this.search() || undefined,
        status: this.status() || undefined,
        speciesId: this.speciesId() || undefined,
        limit: 50,
      })
      .subscribe({
        next: (page) => {
          this.animals.set(page.items);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(this.messageFor(error));
          this.loading.set(false);
        },
      });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.load();
  }

  onStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
    this.load();
  }

  onSpecies(event: Event): void {
    this.speciesId.set((event.target as HTMLSelectElement).value);
    this.load();
  }

  speciesName(id: string): string {
    return this.species().find((item) => item.id === id)?.name ?? id;
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
