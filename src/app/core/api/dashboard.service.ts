import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { ApiClient } from './api-client';
import { DashboardSummary, IndicatorPoint, IndicatorValue } from './dashboard.models';
import { isoDate, monthLabel } from './reporting-format';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiClient);

  load(): Observable<DashboardSummary> {
    return this.api.get<DashboardSummary>('dashboard');
  }

  indicators(from?: string, to?: string): Observable<IndicatorValue[]> {
    return this.api.get<IndicatorValue[]>('indicators', { from, to });
  }

  indicator(code: string, from?: string, to?: string): Observable<IndicatorValue> {
    return this.api.get<IndicatorValue>(`indicators/${code}`, { from, to });
  }

  /**
   * Monthly values for an indicator, oldest first, ending with the current month.
   * A failed month is rendered as missing (null) so it does not hide the rest of the chart.
   */
  indicatorSeries(code: string, months = 6): Observable<IndicatorPoint[]> {
    const now = new Date();
    const calls: Observable<IndicatorPoint>[] = [];
    for (let offset = months - 1; offset >= 0; offset -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const label = monthLabel(start.getMonth() + 1);
      calls.push(
        this.indicator(code, isoDate(start), isoDate(end)).pipe(
          map((indicator) => ({ label, value: indicator.value })),
          catchError(() => of<IndicatorPoint>({ label, value: null })),
        ),
      );
    }
    return forkJoin(calls);
  }
}
