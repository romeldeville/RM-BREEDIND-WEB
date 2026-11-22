import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../core/api/dashboard.service';
import { DashboardAlert, DashboardSummary, IndicatorPoint } from '../../core/api/dashboard.models';
import { formatDecimal } from '../../core/api/reporting-format';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [TranslatePipe, DatePipe, RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly i18n = inject(I18nService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly births = signal<IndicatorPoint[]>([]);
  readonly maxBirths = computed(() =>
    this.births().reduce((max, point) => Math.max(max, point.value ?? 0), 0),
  );
  readonly hasBirths = computed(() => this.maxBirths() > 0);

  readonly formatDecimal = formatDecimal;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      summary: this.dashboard.load(),
      births: this.dashboard.indicatorSeries('BIRTHS_PERIOD'),
    }).subscribe({
      next: ({ summary, births }) => {
        this.summary.set(summary);
        this.births.set(births);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  barHeight(point: IndicatorPoint): string {
    const max = this.maxBirths();
    if (!max || point.value === null) {
      return '2px';
    }
    return `${Math.max(2, (point.value / max) * 100)}%`;
  }

  priorityLabel(priority: string): string {
    switch (priority) {
      case 'CRITICAL':
        return this.i18n.t('alerts.priority.critical');
      case 'IMPORTANT':
        return this.i18n.t('alerts.priority.important');
      default:
        return this.i18n.t('alerts.priority.info');
    }
  }

  severityClass(alert: DashboardAlert): string {
    return `list__item list__item--${alert.priority.toLowerCase()}`;
  }

  trackPoint(index: number, point: IndicatorPoint): string {
    return `${point.label}-${index}`;
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
