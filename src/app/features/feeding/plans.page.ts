import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FeedingPlan, FeedingService } from '../../core/api/feeding.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FEEDING_STYLES } from './feeding-page.styles';

@Component({
  selector: 'app-feeding-plans-page',
  standalone: true,
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Plans d’alimentation</h1>
          <p>Les plans sont définis par espèce dans le référentiel.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Plans</h2>
        @if (loading()) {
          <p>Chargement.</p>
        } @else if (plans().length === 0) {
          <p class="empty">Aucun plan d’alimentation.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Étapes</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              @for (plan of plans(); track plan.id) {
                <tr>
                  <td>{{ plan.name }}</td>
                  <td>{{ plan.stages.length }}</td>
                  <td>{{ plan.active ? 'Actif' : 'Inactif' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [FEEDING_STYLES],
})
export class FeedingPlansPage {
  private readonly feeding = inject(FeedingService);
  private readonly i18n = inject(I18nService);

  readonly plans = signal<FeedingPlan[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.feeding.feedingPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
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
