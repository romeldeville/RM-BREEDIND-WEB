import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ReferentialService,
  Species,
  SpeciesRequest,
  SpeciesTemplate,
} from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

const PRODUCTION_TYPES = ['MEAT', 'MILK', 'EGGS', 'MIXED', 'OTHER'];
const TRACKING_MODES = ['INDIVIDUAL', 'LOT', 'HYBRID'];

@Component({
  selector: 'app-species-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ (isEdit() ? 'ref.formTitleEdit' : 'ref.formTitleNew') | t }}</h1>
          <p>{{ 'ref.formSubtitle' | t }}</p>
        </div>
        <a class="btn btn--ghost" routerLink="/app/species">{{ 'ref.back' | t }}</a>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <form class="card form" [formGroup]="form" (ngSubmit)="save()">
        <div class="grid">
          <label class="field">
            <span>{{ 'ref.name' | t }}</span>
            <input type="text" formControlName="name" autocomplete="off" />
          </label>
          <label class="field">
            <span>{{ 'ref.code' | t }}</span>
            <input type="text" formControlName="code" autocomplete="off" [readonly]="isEdit()" />
          </label>
          <label class="field">
            <span>{{ 'ref.production' | t }}</span>
            <select formControlName="productionType">
              @for (type of productionTypes; track type) {
                <option [value]="type">{{ type }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'ref.tracking' | t }}</span>
            <select formControlName="trackingMode">
              @for (mode of trackingModes; track mode) {
                <option [value]="mode">{{ mode }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'ref.gestationDays' | t }}</span>
            <input type="number" min="0" formControlName="gestationDays" />
          </label>
          <label class="field">
            <span>{{ 'ref.heatCycleDays' | t }}</span>
            <input type="number" min="0" formControlName="heatCycleDays" />
          </label>
          <label class="field">
            <span>{{ 'ref.weaningDays' | t }}</span>
            <input type="number" min="0" formControlName="weaningAgeDays" />
          </label>
          <label class="field">
            <span>{{ 'ref.incubationDays' | t }}</span>
            <input type="number" min="0" formControlName="incubationDays" />
          </label>
        </div>
        <label class="field">
          <span>{{ 'ref.settings' | t }}</span>
          <textarea rows="4" formControlName="settings"></textarea>
          <small>{{ 'ref.settingsHint' | t }}</small>
        </label>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? ('common.loading' | t) : ('common.save' | t) }}
          </button>
        </div>
      </form>

      @if (isEdit()) {
        <section class="card form">
          <h2>{{ 'ref.templates' | t }}</h2>
          <ul class="list">
            @for (template of templates(); track template.id) {
              <li class="list__item">
                <span>{{ template.name }}</span>
                <button type="button" class="btn btn--ghost" (click)="removeTemplate(template)">
                  {{ 'ref.delete' | t }}
                </button>
              </li>
            } @empty {
              <li class="muted">{{ 'common.empty' | t }}</li>
            }
          </ul>
          <form class="inline-form" [formGroup]="templateForm" (ngSubmit)="addTemplate()">
            <label class="field">
              <span>{{ 'ref.templateName' | t }}</span>
              <input type="text" formControlName="name" autocomplete="off" />
            </label>
            <button type="submit" class="btn btn--primary" [disabled]="templateSaving()">
              {{ 'ref.addTemplate' | t }}
            </button>
          </form>
        </section>
      }
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
      .field input,
      .field select,
      .field textarea {
        min-height: var(--touch-target);
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }
      .field small,
      .muted {
        color: var(--color-text-muted);
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
      }
      .inline-form {
        display: flex;
        align-items: flex-end;
        gap: var(--space-3);
      }
      .inline-form .field {
        flex: 1;
      }
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .list__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
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
export class SpeciesFormPage {
  private readonly service = inject(ReferentialService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly productionTypes = PRODUCTION_TYPES;
  readonly trackingModes = TRACKING_MODES;
  readonly speciesId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly isEdit = signal<boolean>(!!this.route.snapshot.paramMap.get('id'));
  readonly saving = signal(false);
  readonly templateSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly templates = signal<SpeciesTemplate[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    code: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    productionType: ['MIXED', [Validators.required]],
    trackingMode: ['INDIVIDUAL', [Validators.required]],
    gestationDays: [null as number | null],
    heatCycleDays: [null as number | null],
    weaningAgeDays: [null as number | null],
    incubationDays: [null as number | null],
    settings: ['{}'],
  });

  readonly templateForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
  });

  constructor() {
    if (this.isEdit()) {
      this.load();
      this.loadTemplates();
    }
  }

  load(): void {
    const id = this.speciesId();
    if (!id) {
      return;
    }
    this.service.speciesById(id).subscribe({
      next: (species) => this.fill(species),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  loadTemplates(): void {
    const id = this.speciesId();
    if (!id) {
      return;
    }
    this.service.templates(id).subscribe({
      next: (items) => this.templates.set(items),
      error: () => this.templates.set([]),
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const settings = this.parseSettings();
    if (settings === undefined) {
      return;
    }
    const value = this.form.getRawValue();
    const request = {
      name: value.name,
      code: value.code,
      productionType: value.productionType,
      trackingMode: value.trackingMode,
      gestationDays: value.gestationDays,
      heatCycleDays: value.heatCycleDays,
      weaningAgeDays: value.weaningAgeDays,
      incubationDays: value.incubationDays,
      settings,
    };
    this.saving.set(true);
    this.error.set(null);
    const id = this.speciesId();
    if (id) {
      const patch: Partial<SpeciesRequest> = { ...request };
      delete patch.code;
      this.service.patchSpecies(id, patch).subscribe({
        next: (species) => {
          this.saving.set(false);
          this.fill(species);
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(this.messageFor(error));
        },
      });
    } else {
      this.service.createSpecies(request).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigateByUrl('/app/species');
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(this.messageFor(error));
        },
      });
    }
  }

  addTemplate(): void {
    const id = this.speciesId();
    if (!id || this.templateForm.invalid || this.templateSaving()) {
      return;
    }
    this.templateSaving.set(true);
    this.service.createTemplate(id, { name: this.templateForm.getRawValue().name }).subscribe({
      next: () => {
        this.templateSaving.set(false);
        this.templateForm.reset({ name: '' });
        this.loadTemplates();
      },
      error: (error: HttpErrorResponse) => {
        this.templateSaving.set(false);
        this.error.set(this.messageFor(error));
      },
    });
  }

  removeTemplate(template: SpeciesTemplate): void {
    this.service.deleteTemplate(template.id).subscribe({
      next: () => this.templates.update((items) => items.filter((i) => i.id !== template.id)),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  private fill(species: Species): void {
    this.speciesId.set(species.id);
    this.isEdit.set(true);
    this.form.patchValue({
      name: species.name,
      code: species.code,
      productionType: species.productionType,
      trackingMode: species.trackingMode,
      gestationDays: species.gestationDays,
      heatCycleDays: species.heatCycleDays,
      weaningAgeDays: species.weaningAgeDays,
      incubationDays: species.incubationDays,
      settings: JSON.stringify(species.settings ?? {}, null, 2),
    });
    this.loadTemplates();
  }

  private parseSettings(): Record<string, unknown> | undefined {
    const raw = this.form.getRawValue().settings.trim();
    if (!raw) {
      return {};
    }
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('invalid');
      }
      return parsed as Record<string, unknown>;
    } catch {
      this.error.set(this.i18n.t('ref.invalidJson'));
      return undefined;
    }
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
