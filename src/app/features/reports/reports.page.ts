import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardService } from '../../core/api/dashboard.service';
import { IndicatorValue } from '../../core/api/dashboard.models';
import { formatIndicatorValue, isoDate } from '../../core/api/reporting-format';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { REPORTS_STYLES } from './reports-page.styles';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [TranslatePipe, DatePipe, FormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ 'reports.title' | t }}</h1>
          <p>{{ 'reports.subtitle' | t }}</p>
        </div>
      </header>

      <article class="card panel">
        <h2>{{ 'reports.period' | t }}</h2>
        <div class="filters">
          <label class="field">
            {{ 'reports.from' | t }}
            <input type="date" name="from" [(ngModel)]="from" />
          </label>
          <label class="field">
            {{ 'reports.to' | t }}
            <input type="date" name="to" [(ngModel)]="to" />
          </label>
          <button class="btn btn--primary" type="button" (click)="load()">
            {{ 'reports.apply' | t }}
          </button>
        </div>
      </article>

      <article class="card panel">
        <h2>{{ 'reports.indicators' | t }}</h2>

        @if (loading()) {
          <p class="muted">{{ 'common.loading' | t }}</p>
        } @else if (error(); as message) {
          <div class="error" role="alert">
            {{ message }}
            <button class="btn btn--ghost" type="button" (click)="load()">
              {{ 'common.retry' | t }}
            </button>
          </div>
        } @else if (indicators().length === 0) {
          <p class="empty">{{ 'reports.empty' | t }}</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>{{ 'reports.label' | t }}</th>
                <th>{{ 'reports.periodColumn' | t }}</th>
                <th>{{ 'reports.value' | t }}</th>
              </tr>
            </thead>
            <tbody>
              @for (indicator of indicators(); track indicator.code) {
                <tr>
                  <td>
                    <strong>{{ indicator.label }}</strong>
                    <div class="code">{{ indicator.code }}</div>
                  </td>
                  <td>
                    @if (indicator.periodStart && indicator.periodEnd) {
                      {{ indicator.periodStart | date: 'dd/MM/yyyy' }} –
                      {{ indicator.periodEnd | date: 'dd/MM/yyyy' }}
                    } @else {
                      <span class="muted">—</span>
                    }
                  </td>
                  <td
                    class="value"
                    [class.value--unavailable]="indicator.value === null"
                    [attr.data-code]="indicator.code"
                  >
                    {{ formatIndicatorValue(indicator) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </article>
    </section>
  `,
  styles: [REPORTS_STYLES],
})
export class ReportsPage implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly i18n = inject(I18nService);

  readonly indicators = signal<IndicatorValue[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  from = '';
  to = '';

  readonly formatIndicatorValue = formatIndicatorValue;

  ngOnInit(): void {
    const today = new Date();
    this.from = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
    this.to = isoDate(today);
    this.load();
  }

  load(): void {
    this.error.set(null);
    if (!this.from || !this.to || this.from > this.to) {
      this.indicators.set([]);
      this.error.set(this.i18n.t('reports.invalidRange'));
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.dashboard.indicators(this.from, this.to).subscribe({
      next: (indicators) => {
        this.indicators.set(indicators);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
