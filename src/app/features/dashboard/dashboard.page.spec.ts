import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DashboardService } from '../../core/api/dashboard.service';
import { DashboardAlert, DashboardSummary, IndicatorPoint } from '../../core/api/dashboard.models';
import { I18nService } from '../../core/i18n/i18n.service';
import { DashboardPage } from './dashboard.page';

const ALERTS: DashboardAlert[] = [1, 2, 3, 4].map((index) => ({
  id: `alert-${index}`,
  farmId: 'farm-1',
  type: 'FARROWING_DUE',
  priority: 'CRITICAL',
  title: `Alerte critique ${index}`,
  message: `Message ${index}`,
  dueDate: '2026-11-20',
  status: 'OPEN',
  entityType: 'cycle',
  entityId: `cycle-${index}`,
  assignedRole: null,
  postponeReason: null,
  createdAt: '2026-11-13T08:00:00Z',
  closedAt: null,
}));

const SUMMARY: DashboardSummary = {
  herdSize: 128,
  openAlerts: 3,
  birthsThisMonth: 17,
  averageDailyGain: null,
  grossMargin: 1250000,
  criticalAlerts: ALERTS,
};

const BIRTHS: IndicatorPoint[] = [
  { label: 'juin', value: 2 },
  { label: 'juil.', value: 4 },
  { label: 'août', value: null },
  { label: 'sept.', value: 3 },
  { label: 'oct.', value: 5 },
  { label: 'nov.', value: 6 },
];

async function render(load = () => of(SUMMARY), series = () => of(BIRTHS)) {
  await TestBed.configureTestingModule({
    imports: [DashboardPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      {
        provide: DashboardService,
        useValue: { load, indicatorSeries: series },
      },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('fr');
  const fixture = TestBed.createComponent(DashboardPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('Dashboard web page', () => {
  it('renders the dashboard KPIs and unavailable values', async () => {
    const fixture = await render();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Tableau de bord');
    expect(text).toContain('Effectif');
    expect(text).toContain('128');
    expect(text).toContain('Naissances (mois)');
    expect(text).toContain('17');
    expect(text).toContain('GMQ moyen');
    expect(text).toContain('Indisponible');
    expect(text).toContain('Marge brute');
    expect(text).toContain('1250000');
    expect(text).toContain('Alertes ouvertes');
    expect(text).toContain('Actions rapides');
  });

  it('renders at most three critical alerts with their priority', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent as string;

    expect(text).toContain('Alertes critiques');
    expect(text).toContain('Alerte critique 1');
    expect(text).toContain('Alerte critique 3');
    expect(text).not.toContain('Alerte critique 4');
    expect(element.querySelectorAll('.list__item--critical').length).toBe(3);
    expect(text).toContain('Critique');
  });

  it('renders the six-month births bar chart', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    const chart = element.querySelector('[data-testid="births-chart"]');
    const bars = element.querySelectorAll<HTMLElement>('.chart__bar');
    const text = element.textContent as string;

    expect(chart).toBeTruthy();
    expect(bars.length).toBe(6);
    expect(text).toContain('Naissances (6 mois)');
    expect(text).toContain('juin');
    expect(text).toContain('nov.');
    expect(element.querySelector('.chart__bar[data-value="6"]')).toBeTruthy();
    expect(Array.from(bars).some((bar) => bar.style.height === '100%')).toBe(true);
  });

  it('shows an empty state when no birth data is available', async () => {
    const fixture = await render(
      () => of(SUMMARY),
      () => of(BIRTHS.map((point) => ({ ...point, value: null }))),
    );
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Aucune donnée de naissance sur la période');
    expect(element.querySelector('[data-testid="births-chart"]')).toBeNull();
  });

  it('shows an error state with a retry action', async () => {
    const fixture = await render(() => throwError(() => new Error('boom')));
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Tableau de bord indisponible');
    expect(text).toContain('Réessayer');
  });
});
