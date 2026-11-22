import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AlertsService, Task } from '../../core/api/alerts.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ALERTS_STYLES } from './alerts-page.styles';
import { formatDate, taskStatusLabel, todayDate } from './alerts-shared';

@Component({
  selector: 'app-alerts-tasks-page',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Tâches</h1>
          <p>Tâches manuelles à réaliser.</p>
        </div>
        <a class="btn btn--ghost" routerLink="/app/alerts">Retour aux alertes</a>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Nouvelle tâche</h2>
        <div class="toolbar">
          <label>
            Titre
            <input name="title" [(ngModel)]="title" />
          </label>
          <label>
            Description
            <input name="description" [(ngModel)]="description" />
          </label>
          <label>
            Échéance
            <input name="dueDate" type="date" [(ngModel)]="dueDate" />
          </label>
          <button class="btn btn--primary" type="button" (click)="submit()">Enregistrer</button>
        </div>
      </section>

      <section class="card panel">
        <h2>Tâches enregistrées</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (tasks().length === 0) {
          <p class="empty">Aucune tâche.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Statut</th>
                <th>Échéance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (task of tasks(); track task.id) {
                <tr>
                  <td>{{ task.title }}</td>
                  <td>{{ taskStatusLabel(task.status) }}</td>
                  <td>{{ formatDate(task.dueDate) }}</td>
                  <td>
                    @if (task.status === 'OPEN') {
                      <button class="btn btn--ghost" type="button" (click)="complete(task)">
                        Terminer
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
export class AlertsTasksPage {
  private readonly alertsService = inject(AlertsService);
  private readonly i18n = inject(I18nService);

  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  title = '';
  description = '';
  dueDate = todayDate();

  readonly taskStatusLabel = taskStatusLabel;
  readonly formatDate = formatDate;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.alertsService.tasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (!this.title.trim()) {
      this.error.set('Titre requis.');
      return;
    }
    this.alertsService
      .createTask({
        title: this.title.trim(),
        description: this.description.trim() || null,
        dueDate: this.dueDate || null,
      })
      .subscribe({
        next: () => {
          this.title = '';
          this.description = '';
          this.dueDate = todayDate();
          this.load();
        },
        error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
      });
  }

  complete(task: Task): void {
    this.alertsService.completeTask(task.id).subscribe({ next: () => this.load() });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
