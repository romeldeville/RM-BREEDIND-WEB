import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Animal, AnimalStatusEntry, HerdService } from '../../core/api/herd.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { HERD_STYLES } from './herd-page.styles';

const STATUSES = ['ACTIVE', 'QUARANTINED', 'SOLD', 'DEAD', 'SLAUGHTERED', 'TRANSFERRED', 'ARCHIVED'];

@Component({
  selector: 'app-animal-status-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ 'herd.statusFiliation' | t }}</h1>
          <p>{{ animal()?.identifier ?? '' }}</p>
        </div>
        <div class="actions">
          @if (animal(); as current) {
            <a class="btn btn--ghost" [routerLink]="['/app/herd', current.id]">
              {{ 'ref.back' | t }}
            </a>
          }
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>{{ 'herd.currentStatus' | t }}</h2>
        <p><span class="badge">{{ animal()?.status ?? '—' }}</span></p>
      </section>

      <form class="card form" [formGroup]="statusForm" (ngSubmit)="saveStatus()">
        <h2>{{ 'herd.changeStatus' | t }}</h2>
        <div class="grid">
          <label class="field">
            <span>{{ 'herd.status' | t }}</span>
            <select formControlName="status">
              @for (item of statuses; track item) {
                <option [value]="item">{{ item }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'herd.reason' | t }}</span>
            <input type="text" formControlName="reason" autocomplete="off" />
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" [disabled]="savingStatus()">
            {{ 'herd.changeStatus' | t }}
          </button>
        </div>
      </form>

      <form class="card form" [formGroup]="filiationForm" (ngSubmit)="saveFiliation()">
        <h2>{{ 'herd.filiation' | t }}</h2>
        <div class="grid">
          <label class="field">
            <span>{{ 'herd.mother' | t }}</span>
            <select formControlName="motherId">
              <option value="">{{ 'herd.none' | t }}</option>
              @for (candidate of candidates(); track candidate.id) {
                <option [value]="candidate.id">{{ label(candidate) }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>{{ 'herd.father' | t }}</span>
            <select formControlName="fatherId">
              <option value="">{{ 'herd.none' | t }}</option>
              @for (candidate of candidates(); track candidate.id) {
                <option [value]="candidate.id">{{ label(candidate) }}</option>
              }
            </select>
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" [disabled]="savingFiliation()">
            {{ 'common.save' | t }}
          </button>
        </div>
      </form>

      <section class="card panel">
        <h2>{{ 'herd.history' | t }}</h2>
        @if (history().length === 0) {
          <p class="muted">{{ 'common.empty' | t }}</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>{{ 'herd.status' | t }}</th>
                <th>{{ 'herd.changedAt' | t }}</th>
                <th>{{ 'herd.reason' | t }}</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of history(); track entry.id) {
                <tr>
                  <td><span class="badge">{{ entry.status }}</span></td>
                  <td>{{ entry.changedAt }}</td>
                  <td>{{ entry.reason ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [HERD_STYLES],
})
export class AnimalStatusPage {
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  readonly statuses = STATUSES;
  readonly animal = signal<Animal | null>(null);
  readonly history = signal<AnimalStatusEntry[]>([]);
  readonly candidates = signal<Animal[]>([]);
  readonly savingStatus = signal(false);
  readonly savingFiliation = signal(false);
  readonly error = signal<string | null>(null);

  readonly statusForm = this.fb.nonNullable.group({
    status: ['ACTIVE', [Validators.required]],
    reason: [''],
  });

  readonly filiationForm = this.fb.nonNullable.group({
    motherId: [''],
    fatherId: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.herd.animal(id).subscribe({
      next: (animal) => {
        this.animal.set(animal);
        this.statusForm.patchValue({ status: animal.status });
        this.filiationForm.patchValue({
          motherId: animal.motherId ?? '',
          fatherId: animal.fatherId ?? '',
        });
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.herd.statusHistory(id).subscribe({
      next: (items) => this.history.set(items),
      error: () => this.history.set([]),
    });
    this.herd.animals({ limit: 100 }).subscribe({
      next: (page) => this.candidates.set(page.items.filter((item) => item.id !== id)),
      error: () => this.candidates.set([]),
    });
  }

  saveStatus(): void {
    const id = this.animal()?.id;
    if (!id || this.statusForm.invalid || this.savingStatus()) {
      return;
    }
    this.savingStatus.set(true);
    this.error.set(null);
    const value = this.statusForm.getRawValue();
    this.herd
      .changeStatus(id, { status: value.status, reason: value.reason || null })
      .subscribe({
        next: () => {
          this.savingStatus.set(false);
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.savingStatus.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  saveFiliation(): void {
    const id = this.animal()?.id;
    if (!id || this.savingFiliation()) {
      return;
    }
    this.savingFiliation.set(true);
    this.error.set(null);
    const value = this.filiationForm.getRawValue();
    this.herd
      .patchAnimal(id, {
        motherId: value.motherId || null,
        fatherId: value.fatherId || null,
      })
      .subscribe({
        next: (animal) => {
          this.savingFiliation.set(false);
          this.animal.set(animal);
        },
        error: (error: HttpErrorResponse) => {
          this.savingFiliation.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  label(animal: Animal): string {
    return animal.name ? `${animal.identifier} · ${animal.name}` : animal.identifier;
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
