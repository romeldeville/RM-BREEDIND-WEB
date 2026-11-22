import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HerdService, Lot } from '../../core/api/herd.service';
import { ReferentialService, Species } from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { HERD_STYLES } from './herd-page.styles';

@Component({
  selector: 'app-lot-detail-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ lot()?.name ?? ('lot.detailTitle' | t) }}</h1>
          <p>{{ lot()?.code ?? '' }}</p>
        </div>
        <div class="actions">
          <a class="btn btn--ghost" routerLink="/app/lots">{{ 'ref.back' | t }}</a>
          @if (lot(); as current) {
            <a class="btn btn--ghost" [routerLink]="['/app/lots', current.id, 'movements']">
              {{ 'lot.movements' | t }}
            </a>
            <a class="btn btn--ghost" [routerLink]="['/app/lots', current.id, 'close']">
              {{ 'lot.close' | t }}
            </a>
            <a class="btn btn--primary" [routerLink]="['/app/lots', current.id, 'edit']">
              {{ 'ref.edit' | t }}
            </a>
          }
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="card panel"><p>{{ 'common.loading' | t }}</p></div>
      } @else if (lot(); as current) {
        <section class="card panel">
          <h2>{{ 'lot.identity' | t }}</h2>
          <div class="detail-grid">
            <div><span>{{ 'lot.name' | t }}</span><strong>{{ current.name }}</strong></div>
            <div><span>{{ 'lot.code' | t }}</span><strong>{{ current.code ?? '—' }}</strong></div>
            <div><span>{{ 'lot.species' | t }}</span><strong>{{ speciesName(current.speciesId) }}</strong></div>
            <div><span>{{ 'lot.productionType' | t }}</span><strong>{{ current.productionType ?? '—' }}</strong></div>
            <div><span>{{ 'lot.status' | t }}</span><strong>{{ current.status }}</strong></div>
            <div><span>{{ 'lot.origin' | t }}</span><strong>{{ current.origin ?? '—' }}</strong></div>
            <div><span>{{ 'lot.entryDate' | t }}</span><strong>{{ current.entryDate ?? '—' }}</strong></div>
            <div><span>{{ 'lot.initialCount' | t }}</span><strong>{{ current.initialCount }}</strong></div>
            <div><span>{{ 'lot.currentCount' | t }}</span><strong>{{ current.currentCount }}</strong></div>
            <div><span>{{ 'lot.unitCost' | t }}</span><strong>{{ current.unitCost ?? '—' }}</strong></div>
            <div><span>{{ 'lot.closedAt' | t }}</span><strong>{{ current.closedAt ?? '—' }}</strong></div>
          </div>
        </section>
      }
    </section>
  `,
  styles: [HERD_STYLES],
})
export class LotDetailPage {
  private readonly herd = inject(HerdService);
  private readonly referential = inject(ReferentialService);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  readonly lot = signal<Lot | null>(null);
  readonly species = signal<Species[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.referential.species().subscribe({
      next: (items) => this.species.set(items),
      error: () => this.species.set([]),
    });
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.herd.lot(id).subscribe({
      next: (lot) => {
        this.lot.set(lot);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  speciesName(id: string): string {
    return this.species().find((item) => item.id === id)?.name ?? id;
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
