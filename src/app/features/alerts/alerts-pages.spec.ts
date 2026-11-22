import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Type } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Alert, AlertsService, Task, TodayBundle } from '../../core/api/alerts.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { AlertsPage } from './alerts.page';
import { AlertsTasksPage } from './tasks.page';
import { AlertsTodayPage } from './today.page';

const ALERT: Alert = {
  id: 'alert-1',
  farmId: 'farm-1',
  type: 'FARROWING_DUE',
  priority: 'CRITICAL',
  title: 'Mise bas prévue',
  message: 'Portée attendue cette semaine',
  dueDate: '2026-11-13',
  status: 'OPEN',
  entityType: 'cycle',
  entityId: 'cycle-1',
  assignedRole: null,
  postponeReason: null,
  createdAt: '2026-11-13T08:00:00Z',
  closedAt: null,
};

const TASK: Task = {
  id: 'task-1',
  farmId: 'farm-1',
  title: 'Nettoyer le bâtiment',
  description: null,
  dueDate: '2026-11-13',
  assignedTo: null,
  recurrence: null,
  status: 'OPEN',
  createdAt: '2026-11-13T08:00:00Z',
  completedAt: null,
};

const TODAY: TodayBundle = { alerts: [ALERT], tasks: [TASK] };

const ALERTS_STUB = {
  alerts: () => of([ALERT]),
  today: () => of(TODAY),
  close: () => of(ALERT),
  postpone: () => of(ALERT),
  cancel: () => of(ALERT),
  tasks: () => of([TASK]),
  createTask: () => of(TASK),
  completeTask: () => of(TASK),
};

async function render<T>(component: Type<T>) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: AlertsService, useValue: ALERTS_STUB },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('fr');
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('Alerts web pages', () => {
  it('renders the alerts list with filters', async () => {
    const fixture = await render(AlertsPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Alertes');
    expect(text).toContain('Filtres');
    expect(text).toContain('Mise bas prévue');
    expect(text).toContain('Critique');
    expect(text).toContain('Ouverte');
  });

  it("renders today's alerts and tasks", async () => {
    const fixture = await render(AlertsTodayPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("À faire aujourd'hui");
    expect(text).toContain('Alertes du jour');
    expect(text).toContain('Mise bas prévue');
    expect(text).toContain('Tâches du jour');
    expect(text).toContain('Nettoyer le bâtiment');
  });

  it('renders the tasks form and list', async () => {
    const fixture = await render(AlertsTasksPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Tâches');
    expect(text).toContain('Nouvelle tâche');
    expect(text).toContain('Tâches enregistrées');
    expect(text).toContain('Nettoyer le bâtiment');
  });
});
