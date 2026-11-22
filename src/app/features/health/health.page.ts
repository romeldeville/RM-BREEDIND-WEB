import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HEALTH_STYLES } from './health-page.styles';

@Component({
  selector: 'app-health-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Santé</h1>
          <p>Produits, vaccinations, traitements, délais d’attente, mortalité et quarantaine.</p>
        </div>
      </header>

      <nav class="toolbar">
        <a class="btn btn--primary" routerLink="/app/health/products">Produits</a>
        <a class="btn btn--ghost" routerLink="/app/health/vaccinations">Vaccination</a>
        <a class="btn btn--ghost" routerLink="/app/health/treatments">Traitement</a>
        <a class="btn btn--ghost" routerLink="/app/health/withdrawals">Délais d’attente</a>
        <a class="btn btn--ghost" routerLink="/app/health/mortalities">Mortalité</a>
        <a class="btn btn--ghost" routerLink="/app/health/quarantines">Quarantaine</a>
      </nav>
    </section>
  `,
  styles: [HEALTH_STYLES],
})
export class HealthPage {}
