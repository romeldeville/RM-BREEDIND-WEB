import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Alert, AlertsService } from '../../core/api/alerts.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ALERTS_STYLES } from './alerts-page.styles';
import { alertStatusLabel, formatDate, isAlertOpen, priorityLabel } from './alerts-shared';

@Component({
  selector: 'app-alerts-page',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Alertes</h1>
          <p>Alertes métier et suivi des échéances.</p>
        </div>
      </header>

      <nav class="toolbar">
        <a class="btn btn--primary" routerLink="/app/alerts/today">À faire aujourd'hui</a>
        <a class="btn btn--ghost" routerLink="/app/alerts/tasks">Tâches</a>
      </nav>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Filtres</h2>
        <div class="toolbar">
          <label>
            Statut
            <select [(ngModel)]="status" (ngModelChange)="load()">
              <option value="">Toutes</option>
              <option value="OPEN">Ouvertes</option>
              <option value="POSTPONED">Reportées</option>
              <option value="CLOSED">Clôturées</option>
              <option value="CANCELLED">Annulées</option>
            </select>
          </label>
          <label>
            Priorité
            <select [(ngModel)]="priority" (ngModelChange)="load()">
              <option value="">Toutes</option>
              <option value="CRITICAL">Critique</option>
              <option value="IMPORTANT">Importante</option>
              <option value="INFO">Information</option>
            </select>
          </label>
        </div>
      </section>

      <section class="card panel">
        <h2>Alertes</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (alerts().length === 0) {
          <p class="empty">Aucune alerte.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Priorité</th>
                <th>Statut</th>
                <th>Échéance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (alert of alerts(); track alert.id) {
                <tr>
                  <td>
                    <strong>{{ alert.title }}</strong>
                    <div>{{ alert.message }}</div>
                  </td>
                  <td>{{ priorityLabel(alert.priority) }}</td>
                  <td>{{ alertStatusLabel(alert.status) }}</td>
                  <td>{{ formatDate(alert.dueDate) }}</td>
                  <td>
                    @if (isAlertOpen(alert.status)) {
                      <button class="btn btn--ghost" type="button" (click)="close(alert)">
                        Clôturer
                      </button>
                      <button class="btn btn--ghost" type="button" (click)="postpone(alert)">
                        Reporter
                      </button>
                      <button class="btn btn--ghost" type="button" (click)="cancel(alert)">
                        Annuler
                      </button>
                    }
                  </td>
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
export class AlertsPage {
  private readonly alertsService = inject(AlertsService);
  private readonly i18n = inject(I18nService);

  readonly alerts = signal<Alert[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  status = '';
  priority = '';

  readonly priorityLabel = priorityLabel;
  readonly alertStatusLabel = alertStatusLabel;
  readonly formatDate = formatDate;
  readonly isAlertOpen = isAlertOpen;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.alertsService.alerts({ status: this.status, priority: this.priority }).subscribe({
      next: (alerts) => {
        this.alerts.set(alerts);
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

  postpone(alert: Alert): void {
    const dueDate = window.prompt('Nouvelle échéance (AAAA-MM-JJ)', alert.dueDate ?? '');
    if (!dueDate) {
      return;
    }
    const reason = window.prompt('Motif du report', '');
    if (!reason) {
      return;
    }
    this.alertsService.postpone(alert.id, { dueDate, reason }).subscribe({ next: () => this.load() });
  }

  cancel(alert: Alert): void {
    const reason = window.prompt("Motif d'annulation", '');
    if (!reason) {
      return;
    }
    this.alertsService.cancel(alert.id, reason).subscribe({ next: () => this.load() });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
