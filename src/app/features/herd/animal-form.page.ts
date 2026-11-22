import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AnimalRequest, HerdService } from '../../core/api/herd.service';
import { Breed, Farm, ReferentialService, Species } from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { HERD_STYLES } from './herd-page.styles';

const SEXES = ['FEMALE', 'MALE', 'UNKNOWN'];

@Component({
  selector: 'app-animal-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ (isEdit() ? 'herd.editAnimal' : 'herd.newAnimal') | t }}</h1>
          <p>{{ 'herd.formSubtitle' | t }}</p>
        </div>
        <a class="btn btn--ghost" routerLink="/app/herd">{{ 'ref.back' | t }}</a>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <form class="card form" [formGroup]="form" (ngSubmit)="save()">
        <div class="grid">
          <label class="field">
            <span>{{ 'herd.farm' | t }}</span>
            <select formControlName="farmId" [attr.disabled]="isEdit() ? '' : null">
              @for (farm of farms(); track farm.id) {
                <option [value]="farm.id">{{ farm.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'herd.species' | t }}</span>
            <select formControlName="speciesId" (change)="onSpecies($event)" [attr.disabled]="isEdit() ? '' : null">
              @for (species of speciesList(); track species.id) {
                <option [value]="species.id">{{ species.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'herd.breed' | t }}</span>
            <select formControlName="breedId">
              <option value="">{{ 'herd.noBreed' | t }}</option>
              @for (breed of breeds(); track breed.id) {
                <option [value]="breed.id">{{ breed.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'herd.identifier' | t }}</span>
            <input type="text" formControlName="identifier" autocomplete="off" />
          </label>
          <label class="field">
            <span>{{ 'herd.name' | t }}</span>
            <input type="text" formControlName="name" autocomplete="off" />
          </label>
          <label class="field">
            <span>{{ 'herd.sex' | t }}</span>
            <select formControlName="sex">
              @for (sex of sexes; track sex) {
                <option [value]="sex">{{ sex }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'herd.birthDate' | t }}</span>
            <input type="date" formControlName="birthDate" />
          </label>
          <label class="field">
            <span>{{ 'herd.weight' | t }}</span>
            <input type="number" min="0" step="0.1" formControlName="weightKg" />
          </label>
          <label class="field">
            <span>{{ 'herd.origin' | t }}</span>
            <input type="text" formControlName="origin" autocomplete="off" />
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? ('common.loading' | t) : ('common.save' | t) }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [HERD_STYLES],
})
export class AnimalFormPage {
  private readonly herd = inject(HerdService);
  private readonly referential = inject(ReferentialService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly sexes = SEXES;
  readonly animalId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly isEdit = signal<boolean>(!!this.route.snapshot.paramMap.get('id'));
  readonly farms = signal<Farm[]>([]);
  readonly speciesList = signal<Species[]>([]);
  readonly breeds = signal<Breed[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    farmId: ['', [Validators.required]],
    speciesId: ['', [Validators.required]],
    breedId: [''],
    identifier: ['', [Validators.required, Validators.maxLength(80)]],
    name: [''],
    sex: ['FEMALE', [Validators.required]],
    birthDate: [''],
    weightKg: [null as number | null],
    origin: [''],
  });

  constructor() {
    this.loadFarms();
    this.loadSpecies();
    if (this.isEdit()) {
      this.loadAnimal();
    }
  }

  loadFarms(): void {
    this.referential.farms().subscribe({
      next: (items) => {
        this.farms.set(items);
        if (!this.isEdit() && items.length > 0 && !this.form.getRawValue().farmId) {
          this.form.patchValue({ farmId: items[0].id });
        }
      },
      error: () => this.farms.set([]),
    });
  }

  loadSpecies(): void {
    this.referential.species().subscribe({
      next: (items) => {
        this.speciesList.set(items);
        if (!this.isEdit() && items.length > 0 && !this.form.getRawValue().speciesId) {
          this.form.patchValue({ speciesId: items[0].id });
          this.loadBreeds(items[0].id);
        }
      },
      error: () => this.speciesList.set([]),
    });
  }

  loadAnimal(): void {
    const id = this.animalId();
    if (!id) {
      return;
    }
    this.herd.animal(id).subscribe({
      next: (animal) => {
        this.form.patchValue({
          farmId: animal.farmId,
          speciesId: animal.speciesId,
          breedId: animal.breedId ?? '',
          identifier: animal.identifier,
          name: animal.name ?? '',
          sex: animal.sex,
          birthDate: animal.birthDate ?? '',
          weightKg: animal.weightKg,
          origin: animal.origin ?? '',
        });
        this.loadBreeds(animal.speciesId);
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  loadBreeds(speciesId: string): void {
    if (!speciesId) {
      this.breeds.set([]);
      return;
    }
    this.referential.breeds(speciesId).subscribe({
      next: (items) => this.breeds.set(items),
      error: () => this.breeds.set([]),
    });
  }

  onSpecies(event: Event): void {
    const speciesId = (event.target as HTMLSelectElement).value;
    this.form.patchValue({ speciesId, breedId: '' });
    this.loadBreeds(speciesId);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const base: AnimalRequest = {
      farmId: value.farmId,
      speciesId: value.speciesId,
      breedId: value.breedId || null,
      identifier: value.identifier,
      name: value.name || null,
      sex: value.sex,
      birthDate: value.birthDate || null,
      weightKg: value.weightKg,
      origin: value.origin || null,
    };
    this.saving.set(true);
    this.error.set(null);
    const id = this.animalId();
    if (id) {
      const patch: Partial<AnimalRequest> = {
        identifier: base.identifier,
        name: base.name,
        sex: base.sex,
        breedId: base.breedId,
        birthDate: base.birthDate,
        weightKg: base.weightKg,
        origin: base.origin,
      };
      this.herd.patchAnimal(id, patch).subscribe({
        next: (animal) => {
          this.saving.set(false);
          this.router.navigate(['/app/herd', animal.id]);
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(this.messageFor(error));
        },
      });
    } else {
      this.herd.createAnimal(base).subscribe({
        next: (animal) => {
          this.saving.set(false);
          this.router.navigate(['/app/herd', animal.id]);
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(this.messageFor(error));
        },
      });
    }
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
