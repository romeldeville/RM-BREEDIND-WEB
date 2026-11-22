import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Breed, ReferentialService } from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-breeds-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ 'ref.breedsTitle' | t }}</h1>
          <p>{{ 'ref.breedsSubtitle' | t }}</p>
        </div>
        <a class="btn btn--ghost" routerLink="/app/species">{{ 'ref.back' | t }}</a>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <form class="card form" [formGroup]="form" (ngSubmit)="add()">
        <div class="grid">
          <label class="field">
            <span>{{ 'ref.breedName' | t }}</span>
            <input type="text" formControlName="name" autocomplete="off" />
          </label>
          <label class="field">
            <span>{{ 'ref.code' | t }}</span>
            <input type="text" formControlName="code" autocomplete="off" />
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ 'ref.addBreed' | t }}
          </button>
        </div>
      </form>

      <div class="card panel">
        @if (loading()) {
          <p>{{ 'common.loading' | t }}</p>
        } @else if (breeds().length === 0) {
          <p class="muted">{{ 'common.empty' | t }}</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>{{ 'ref.breedName' | t }}</th>
                <th>{{ 'ref.code' | t }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (breed of breeds(); track breed.id) {
                <tr>
                  <td>{{ breed.name }}</td>
                  <td>{{ breed.code ?? '—' }}</td>
                  <td class="row-actions">
                    <button type="button" class="btn btn--ghost" (click)="archive(breed)">
                      {{ 'ref.archive' | t }}
                    </button>
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
      .form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-6);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--space-4);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        font-size: var(--font-size-sm);
      }
      .field input {
        min-height: var(--touch-target);
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
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
      }
      .row-actions {
        display: flex;
        justify-content: flex-end;
      }
      .row-actions .btn {
        min-height: 36px;
        padding: 0 var(--space-3);
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
export class BreedsPage {
  private readonly service = inject(ReferentialService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  readonly speciesId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly breeds = signal<Breed[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    code: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.breeds(this.speciesId).subscribe({
      next: (items) => {
        this.breeds.set(items);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  add(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const value = this.form.getRawValue();
    this.service.createBreed(this.speciesId, { name: value.name, code: value.code || null }).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset({ name: '', code: '' });
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(this.messageFor(error));
      },
    });
  }

  archive(breed: Breed): void {
    this.service.archiveBreed(breed.id).subscribe({
      next: () => this.breeds.update((items) => items.filter((i) => i.id !== breed.id)),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
