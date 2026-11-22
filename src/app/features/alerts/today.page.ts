import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Alert, AlertsService, TodayBundle } from '../../core/api/alerts.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ALERTS_STYLES } from './alerts-page.styles';
import { formatDate, priorityLabel, taskStatusLabel } from './alerts-shared';

@Component({
  selector: 'app-alerts-today-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>À faire aujourd'hui</h1>
          <p>Alertes dues et tâches du jour.</p>
        </div>
        <a class="btn btn--ghost" routerLink="/app/alerts">Retour aux alertes</a>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Alertes du jour</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (bundle().alerts.length === 0) {
          <p class="empty">Aucune alerte, tout va bien.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Priorité</th>
                <th>Échéance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (alert of bundle().alerts; track alert.id) {
                <tr>
                  <td>{{ alert.title }}</td>
                  <td>{{ priorityLabel(alert.priority) }}</td>
                  <td>{{ formatDate(alert.dueDate) }}</td>
                  <td>
                    <button class="btn btn--ghost" type="button" (click)="close(alert)">
                      Clôturer
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      <section class="card panel">
        <h2>Tâches du jour</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (bundle().tasks.length === 0) {
          <p class="empty">Aucune tâche.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Statut</th>
                <th>Échéance</th>
              </tr>
            </thead>
            <tbody>
              @for (task of bundle().tasks; track task.id) {
                <tr>
                  <td>{{ task.title }}</td>
                  <td>{{ taskStatusLabel(task.status) }}</td>
                  <td>{{ formatDate(task.dueDate) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [ALERTS_STYLES],
})
export class AlertsTodayPage {
  private readonly alertsService = inject(AlertsService);
  private readonly i18n = inject(I18nService);

  readonly bundle = signal<TodayBundle>({ alerts: [], tasks: [] });
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly priorityLabel = priorityLabel;
  readonly taskStatusLabel = taskStatusLabel;
  readonly formatDate = formatDate;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.alertsService.today().subscribe({
      next: (bundle) => {
        this.bundle.set(bundle);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  close(alert: Alert): void {
    this.alertsService.close(alert.id).subscribe({ next: () => this.load() });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
