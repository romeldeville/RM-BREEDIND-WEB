import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HerdService, Lot, LotClosure } from '../../core/api/herd.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { HERD_STYLES } from './herd-page.styles';

@Component({
  selector: 'app-lot-close-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ 'lot.closeTitle' | t }}</h1>
          <p>{{ lot()?.name ?? '' }}</p>
        </div>
        <div class="actions">
          @if (lot(); as current) {
            <a class="btn btn--ghost" [routerLink]="['/app/lots', current.id]">
              {{ 'ref.back' | t }}
            </a>
          }
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      @if (lot(); as current) {
        <section class="card panel">
          <h2>{{ 'lot.currentCount' | t }}</h2>
          <p class="count">{{ current.currentCount }} / {{ current.initialCount }}</p>
          @if (current.status === 'CLOSED') {
            <div class="notice">{{ 'lot.alreadyClosed' | t }}</div>
          } @else if (current.currentCount !== 0) {
            <div class="notice">{{ 'lot.closeBlocked' | t }}</div>
          }
          <div class="form-actions">
            <button
              type="button"
              class="btn btn--primary"
              [disabled]="current.currentCount !== 0 || current.status === 'CLOSED' || closing()"
              (click)="close()"
            >
              {{ closing() ? ('common.loading' | t) : ('lot.closeAction' | t) }}
            </button>
          </div>
        </section>
      }

      @if (closure(); as result) {
        <section class="card panel">
          <h2>{{ 'lot.balance' | t }}</h2>
          <div class="detail-grid">
            <div><span>{{ 'lot.mortalityRate' | t }}</span><strong>{{ result.mortalityRate ?? '—' }}</strong></div>
            <div><span>{{ 'lot.cost' | t }}</span><strong>{{ result.cost ?? '—' }}</strong></div>
            <div><span>{{ 'lot.closedAt' | t }}</span><strong>{{ result.closedAt }}</strong></div>
          </div>
        </section>
      }
    </section>
  `,
  styles: [
    HERD_STYLES,
    `
      .count {
        font-size: var(--font-size-xl, 1.5rem);
        font-weight: 700;
        margin: 0;
      }
    `,
  ],
})
export class LotClosePage {
  private readonly herd = inject(HerdService);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  readonly lot = signal<Lot | null>(null);
  readonly closure = signal<LotClosure | null>(null);
  readonly closing = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.herd.lot(id).subscribe({
      next: (lot) => this.lot.set(lot),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  close(): void {
    const id = this.lot()?.id;
    if (!id || this.closing()) {
      return;
    }
    this.closing.set(true);
    this.error.set(null);
    this.herd.closeLot(id).subscribe({
      next: (closure) => {
        this.closing.set(false);
        this.closure.set(closure);
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.closing.set(false);
        this.error.set(this.messageFor(error));
      },
    });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
