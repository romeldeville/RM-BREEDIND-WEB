import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HerdService, Lot } from '../../core/api/herd.service';
import { ReferentialService, Species } from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { HERD_STYLES } from './herd-page.styles';

const STATUSES = ['OPEN', 'CLOSED'];

@Component({
  selector: 'app-lot-list-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ 'lot.title' | t }}</h1>
          <p>{{ 'lot.subtitle' | t }}</p>
        </div>
        <div class="actions">
          <a class="btn btn--ghost" routerLink="/app/herd">{{ 'herd.title' | t }}</a>
          <a class="btn btn--primary" routerLink="/app/lots/new">{{ 'lot.new' | t }}</a>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <div class="card panel">
        <div class="filters">
          <label class="field">
            <span>{{ 'lot.status' | t }}</span>
            <select [value]="status()" (change)="onStatus($event)">
              <option value="">{{ 'lot.allStatuses' | t }}</option>
              @for (item of statuses; track item) {
                <option [value]="item">{{ item }}</option>
              }
            </select>
          </label>
        </div>

        @if (loading()) {
          <p>{{ 'common.loading' | t }}</p>
        } @else if (lots().length === 0) {
          <p class="muted">{{ 'common.empty' | t }}</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>{{ 'lot.name' | t }}</th>
                <th>{{ 'lot.code' | t }}</th>
                <th>{{ 'lot.species' | t }}</th>
                <th>{{ 'lot.entryDate' | t }}</th>
                <th>{{ 'lot.count' | t }}</th>
                <th>{{ 'lot.status' | t }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (lot of lots(); track lot.id) {
                <tr>
                  <td><strong>{{ lot.name }}</strong></td>
                  <td>{{ lot.code ?? '—' }}</td>
                  <td>{{ speciesName(lot.speciesId) }}</td>
                  <td>{{ lot.entryDate ?? '—' }}</td>
                  <td>{{ lot.currentCount }} / {{ lot.initialCount }}</td>
                  <td><span class="badge">{{ lot.status }}</span></td>
                  <td class="row-actions">
                    <a class="btn btn--ghost" [routerLink]="['/app/lots', lot.id]">
                      {{ 'lot.detail' | t }}
                    </a>
                    <a class="btn btn--ghost" [routerLink]="['/app/lots', lot.id, 'edit']">
                      {{ 'ref.edit' | t }}
                    </a>
                    <a class="btn btn--ghost" [routerLink]="['/app/lots', lot.id, 'movements']">
                      {{ 'lot.movements' | t }}
                    </a>
                    <a class="btn btn--ghost" [routerLink]="['/app/lots', lot.id, 'close']">
                      {{ 'lot.close' | t }}
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
export class LotListPage {
  private readonly herd = inject(HerdService);
  private readonly referential = inject(ReferentialService);
  private readonly i18n = inject(I18nService);

  readonly statuses = STATUSES;
  readonly lots = signal<Lot[]>([]);
  readonly species = signal<Species[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly status = signal('');

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
      .lots({ status: this.status() || undefined, limit: 50 })
      .subscribe({
        next: (page) => {
          this.lots.set(page.items);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(this.messageFor(error));
          this.loading.set(false);
        },
      });
  }

  onStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
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
