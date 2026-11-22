import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DashboardService } from '../../core/api/dashboard.service';
import { IndicatorValue } from '../../core/api/dashboard.models';
import { I18nService } from '../../core/i18n/i18n.service';
import { ReportsPage } from './reports.page';

const INDICATORS: IndicatorValue[] = [
  {
    code: 'HERD_SIZE',
    label: 'Effectif total',
    unit: 'têtes',
    value: 128,
    periodStart: '2026-11-01',
    periodEnd: '2026-11-15',
  },
  {
    code: 'LAYING_RATE',
    label: 'Taux de ponte',
    unit: '%',
    value: null,
    periodStart: '2026-11-01',
    periodEnd: '2026-11-15',
  },
];

async function render(indicators = vi.fn(() => of(INDICATORS))) {
  await TestBed.configureTestingModule({
    imports: [ReportsPage],
    providers: [
      provideZonelessChangeDetection(),
      { provide: DashboardService, useValue: { indicators } },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('fr');
  const fixture = TestBed.createComponent(ReportsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, indicators };
}

describe('Reports web page', () => {
  it('renders indicators for the default month-to-date period', async () => {
    const { fixture, indicators } = await render();
    const text = fixture.nativeElement.textContent as string;
    const [from, to] = indicators.mock.calls[0] as unknown as [string, string];

    expect(text).toContain('Rapports détaillés');
    expect(text).toContain('Indicateurs');
    expect(text).toContain('Effectif total');
    expect(text).toContain('HERD_SIZE');
    expect(text).toContain('128 têtes');
    expect(text).toContain('Taux de ponte');
    expect(text).toContain('Indisponible');
    expect(from.endsWith('-01')).toBe(true);
    expect(from <= to).toBe(true);
  });

  it('reloads indicators when the period is applied', async () => {
    const { fixture, indicators } = await render();
    const component = fixture.componentInstance;
    component.from = '2026-10-01';
    component.to = '2026-10-31';

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button.btn--primary',
    ) as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(indicators).toHaveBeenCalledTimes(2);
    expect(indicators).toHaveBeenLastCalledWith('2026-10-01', '2026-10-31');
  });

  it('rejects an inverted period without calling the API', async () => {
    const { fixture, indicators } = await render();
    const component = fixture.componentInstance;
    component.from = '2026-11-15';
    component.to = '2026-11-01';
    component.load();
    fixture.detectChanges();

    expect(indicators).toHaveBeenCalledTimes(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'La date de début doit précéder la date de fin.',
    );
  });

  it('shows an error state with a retry action', async () => {
    const { fixture } = await render(vi.fn(() => throwError(() => new Error('boom'))));
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Une erreur est survenue');
    expect(text).toContain('Réessayer');
  });
});
