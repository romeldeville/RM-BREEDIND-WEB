import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ReferentialService, Species } from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-species-list-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ 'ref.title' | t }}</h1>
          <p>{{ 'ref.subtitle' | t }}</p>
        </div>
        <div class="actions">
          <label class="toggle">
            <input
              type="checkbox"
              [checked]="includeArchived()"
              (change)="toggleArchived($event)"
            />
            <span>{{ 'ref.includeArchived' | t }}</span>
          </label>
          <a class="btn btn--primary" routerLink="/app/species/new">{{ 'ref.new' | t }}</a>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <div class="card panel">
        @if (loading()) {
          <p>{{ 'common.loading' | t }}</p>
        } @else if (species().length === 0) {
          <p class="muted">{{ 'common.empty' | t }}</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>{{ 'ref.name' | t }}</th>
                <th>{{ 'ref.code' | t }}</th>
                <th>{{ 'ref.production' | t }}</th>
                <th>{{ 'ref.tracking' | t }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of species(); track item.id) {
                <tr [class.archived]="item.archivedAt">
                  <td>
                    <strong>{{ item.name }}</strong>
                    @if (item.archivedAt) {
                      <span class="badge">{{ 'ref.archived' | t }}</span>
                    }
                  </td>
                  <td>{{ item.code }}</td>
                  <td>{{ item.productionType }}</td>
                  <td>{{ item.trackingMode }}</td>
                  <td class="row-actions">
                    <a class="btn btn--ghost" [routerLink]="['/app/species', item.id, 'edit']">
                      {{ 'ref.edit' | t }}
                    </a>
                    <a class="btn btn--ghost" [routerLink]="['/app/species', item.id, 'breeds']">
                      {{ 'ref.breeds' | t }}
                    </a>
                    <a class="btn btn--ghost" [routerLink]="['/app/species', item.id, 'plans']">
                      {{ 'ref.plans' | t }}
                    </a>
                    @if (!item.archivedAt) {
                      <button type="button" class="btn btn--ghost" (click)="archive(item)">
                        {{ 'ref.archive' | t }}
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .actions {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }
      .toggle {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-size-sm);
      }
      .panel {
        padding: var(--space-4);
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--font-size-sm);
      }
      .table th,
      .table td {
        text-align: left;
        padding: var(--space-3);
        border-bottom: 1px solid var(--color-border);
        vertical-align: middle;
      }
      .row-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        justify-content: flex-end;
      }
      .row-actions .btn {
        min-height: 36px;
        padding: 0 var(--space-3);
        font-size: var(--font-size-xs);
      }
      .archived {
        opacity: 0.6;
      }
      .badge {
        margin-left: var(--space-2);
        padding: 2px var(--space-2);
        border-radius: var(--radius-full);
        background: var(--color-border);
        font-size: var(--font-size-xs);
      }
      .muted {
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
export class SpeciesListPage {
  private readonly service = inject(ReferentialService);
  private readonly i18n = inject(I18nService);

  readonly species = signal<Species[]>([]);
  readonly loading = signal(false);
  readonly includeArchived = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  toggleArchived(event: Event): void {
    this.includeArchived.set((event.target as HTMLInputElement).checked);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.species(this.includeArchived()).subscribe({
      next: (items) => {
        this.species.set(items);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  archive(item: Species): void {
    if (typeof window !== 'undefined' && !window.confirm(this.i18n.t('ref.archiveConfirm'))) {
      return;
    }
    this.service.archiveSpecies(item.id).subscribe({
      next: () => this.load(),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
