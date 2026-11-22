import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService } from '../../core/api/herd.service';
import { Breed, ReferentialService, Species } from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { HERD_STYLES } from './herd-page.styles';

@Component({
  selector: 'app-animal-detail-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ animal()?.identifier ?? ('herd.detailTitle' | t) }}</h1>
          <p>{{ animal()?.name ?? ('herd.detailSubtitle' | t) }}</p>
        </div>
        <div class="actions">
          <a class="btn btn--ghost" routerLink="/app/herd">{{ 'ref.back' | t }}</a>
          @if (animal(); as current) {
            <a class="btn btn--ghost" [routerLink]="['/app/herd', current.id, 'status']">
              {{ 'herd.statusFiliation' | t }}
            </a>
            <a class="btn btn--primary" [routerLink]="['/app/herd', current.id, 'edit']">
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
      } @else if (animal(); as current) {
        <section class="card panel">
          <h2>{{ 'herd.identity' | t }}</h2>
          <div class="detail-grid">
            <div><span>{{ 'herd.identifier' | t }}</span><strong>{{ current.identifier }}</strong></div>
            <div><span>{{ 'herd.name' | t }}</span><strong>{{ current.name ?? '—' }}</strong></div>
            <div><span>{{ 'herd.species' | t }}</span><strong>{{ speciesName(current.speciesId) }}</strong></div>
            <div><span>{{ 'herd.breed' | t }}</span><strong>{{ breedName(current.breedId) }}</strong></div>
            <div><span>{{ 'herd.sex' | t }}</span><strong>{{ current.sex }}</strong></div>
            <div><span>{{ 'herd.status' | t }}</span><strong>{{ current.status }}</strong></div>
            <div><span>{{ 'herd.birthDate' | t }}</span><strong>{{ current.birthDate ?? '—' }}</strong></div>
            <div><span>{{ 'herd.origin' | t }}</span><strong>{{ current.origin ?? '—' }}</strong></div>
            <div><span>{{ 'herd.weight' | t }}</span><strong>{{ current.weightKg ?? '—' }}</strong></div>
            <div><span>{{ 'herd.acquiredAt' | t }}</span><strong>{{ current.acquiredAt ?? '—' }}</strong></div>
          </div>
        </section>

        <section class="card panel">
          <h2>{{ 'herd.filiation' | t }}</h2>
          <div class="detail-grid">
            <div><span>{{ 'herd.mother' | t }}</span><strong>{{ current.motherId ?? '—' }}</strong></div>
            <div><span>{{ 'herd.father' | t }}</span><strong>{{ current.fatherId ?? '—' }}</strong></div>
          </div>
        </section>
      }
    </section>
  `,
  styles: [HERD_STYLES],
})
export class AnimalDetailPage {
  private readonly herd = inject(HerdService);
  private readonly referential = inject(ReferentialService);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  readonly animal = signal<Animal | null>(null);
  readonly species = signal<Species[]>([]);
  readonly breeds = signal<Breed[]>([]);
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
    this.herd.animal(id).subscribe({
      next: (animal) => {
        this.animal.set(animal);
        this.loading.set(false);
        this.referential.breeds(animal.speciesId).subscribe({
          next: (items) => this.breeds.set(items),
          error: () => this.breeds.set([]),
        });
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

  breedName(id: string | null): string {
    if (!id) {
      return '—';
    }
    return this.breeds().find((item) => item.id === id)?.name ?? id;
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
