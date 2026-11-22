import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, HerdService } from '../../core/api/herd.service';
import { ReproductionService } from '../../core/api/reproduction.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { REPRODUCTION_STYLES } from './reproduction-page.styles';
import { animalLabel, dateToInstant, todayDate } from './reproduction-shared';

@Component({
  selector: 'app-mating-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Saillie</h1>
          <p>Saillie naturelle ou insémination artificielle.</p>
        </div>
        <a class="btn btn--ghost" routerLink="/app/reproduction">Retour</a>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <form class="card form" [formGroup]="form" (ngSubmit)="save()">
        <h2>Saillie ou insémination</h2>
        <div class="grid">
          <label class="field">
            <span>Femelle</span>
            <select formControlName="femaleId">
              @for (female of females(); track female.id) {
                <option [value]="female.id">{{ label(female) }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Mâle</span>
            <select formControlName="maleId">
              <option value="">Non précisé</option>
              @for (male of males(); track male.id) {
                <option [value]="male.id">{{ label(male) }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Méthode</span>
            <select formControlName="method">
              @for (method of methods; track method) {
                <option [value]="method">{{ method }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Date de saillie</span>
            <input type="date" formControlName="matedAt" />
          </label>
          <label class="field">
            <span>Code semence</span>
            <input type="text" formControlName="semenCode" />
          </label>
          <label class="field">
            <span>Notes</span>
            <textarea rows="3" formControlName="notes"></textarea>
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [REPRODUCTION_STYLES],
})
export class MatingPage {
  private readonly reproduction = inject(ReproductionService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly methods = ['NATURAL', 'AI'];
  readonly animals = signal<Animal[]>([]);
  readonly females = computed(() => this.animals().filter((animal) => animal.sex === 'FEMALE'));
  readonly males = computed(() => this.animals().filter((animal) => animal.sex === 'MALE'));
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    femaleId: ['', [Validators.required]],
    maleId: [''],
    method: ['NATURAL'],
    matedAt: [todayDate(), [Validators.required]],
    semenCode: [''],
    notes: [''],
  });

  constructor() {
    this.herd.animals({ limit: 100 }).subscribe({
      next: (page) => {
        this.animals.set(page.items);
        const female = page.items.find((animal) => animal.sex === 'FEMALE');
        if (female && !this.form.getRawValue().femaleId) {
          this.form.patchValue({ femaleId: female.id });
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const matedAt = dateToInstant(value.matedAt);
    if (!matedAt) {
      this.error.set('La date de saillie est invalide.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.reproduction
      .recordMating({
        femaleId: value.femaleId,
        maleId: value.maleId || null,
        semenCode: value.semenCode.trim() || null,
        method: value.method || null,
        matedAt,
        notes: value.notes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/app/reproduction']);
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  label(animal: Animal): string {
    return animalLabel(animal);
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
