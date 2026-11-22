import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HerdService, LotRequest } from '../../core/api/herd.service';
import { Farm, ReferentialService, Species } from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { HERD_STYLES } from './herd-page.styles';

const PRODUCTION_TYPES = ['MEAT', 'MILK', 'EGGS', 'MIXED', 'OTHER'];

@Component({
  selector: 'app-lot-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ (isEdit() ? 'lot.editTitle' : 'lot.newTitle') | t }}</h1>
          <p>{{ 'lot.formSubtitle' | t }}</p>
        </div>
        <a class="btn btn--ghost" routerLink="/app/lots">{{ 'ref.back' | t }}</a>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <form class="card form" [formGroup]="form" (ngSubmit)="save()">
        <div class="grid">
          <label class="field">
            <span>{{ 'herd.farm' | t }}</span>
            <select formControlName="farmId" [disabled]="isEdit()">
              @for (farm of farms(); track farm.id) {
                <option [value]="farm.id">{{ farm.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'lot.species' | t }}</span>
            <select formControlName="speciesId" [disabled]="isEdit()">
              @for (species of speciesList(); track species.id) {
                <option [value]="species.id">{{ species.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'lot.name' | t }}</span>
            <input type="text" formControlName="name" autocomplete="off" />
          </label>
          <label class="field">
            <span>{{ 'lot.code' | t }}</span>
            <input type="text" formControlName="code" autocomplete="off" />
          </label>
          <label class="field">
            <span>{{ 'lot.productionType' | t }}</span>
            <select formControlName="productionType">
              @for (type of productionTypes; track type) {
                <option [value]="type">{{ type }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'lot.entryDate' | t }}</span>
            <input type="date" formControlName="entryDate" />
          </label>
          <label class="field">
            <span>{{ 'lot.initialCount' | t }}</span>
            <input type="number" min="0" formControlName="initialCount" [readonly]="isEdit()" />
          </label>
          <label class="field">
            <span>{{ 'lot.unitCost' | t }}</span>
            <input type="number" min="0" step="0.01" formControlName="unitCost" />
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
export class LotFormPage {
  private readonly herd = inject(HerdService);
  private readonly referential = inject(ReferentialService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly productionTypes = PRODUCTION_TYPES;
  readonly lotId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly isEdit = signal<boolean>(!!this.route.snapshot.paramMap.get('id'));
  readonly farms = signal<Farm[]>([]);
  readonly speciesList = signal<Species[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    farmId: ['', [Validators.required]],
    speciesId: ['', [Validators.required]],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    code: [''],
    productionType: ['MIXED'],
    entryDate: [''],
    initialCount: [0, [Validators.required, Validators.min(0)]],
    unitCost: [null as number | null],
  });

  constructor() {
    this.loadFarms();
    this.loadSpecies();
    if (this.isEdit()) {
      this.loadLot();
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
        }
      },
      error: () => this.speciesList.set([]),
    });
  }

  loadLot(): void {
    const id = this.lotId();
    if (!id) {
      return;
    }
    this.herd.lot(id).subscribe({
      next: (lot) => {
        this.form.patchValue({
          farmId: lot.farmId,
          speciesId: lot.speciesId,
          name: lot.name,
          code: lot.code ?? '',
          productionType: lot.productionType ?? 'MIXED',
          entryDate: lot.entryDate ?? '',
          initialCount: lot.initialCount,
          unitCost: lot.unitCost,
        });
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
    const base: LotRequest = {
      farmId: value.farmId,
      speciesId: value.speciesId,
      name: value.name,
      code: value.code || null,
      productionType: value.productionType || null,
      entryDate: value.entryDate || null,
      initialCount: value.initialCount,
      unitCost: value.unitCost,
    };
    this.saving.set(true);
    this.error.set(null);
    const id = this.lotId();
    if (id) {
      const patch: Partial<LotRequest> = {
        name: base.name,
        code: base.code,
        productionType: base.productionType,
        entryDate: base.entryDate,
        unitCost: base.unitCost,
      };
      this.herd.patchLot(id, patch).subscribe({
        next: (lot) => {
          this.saving.set(false);
          this.router.navigate(['/app/lots', lot.id]);
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(this.messageFor(error));
        },
      });
    } else {
      this.herd.createLot(base).subscribe({
        next: (lot) => {
          this.saving.set(false);
          this.router.navigate(['/app/lots', lot.id]);
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
