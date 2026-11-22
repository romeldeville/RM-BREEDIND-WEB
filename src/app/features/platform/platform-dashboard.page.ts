import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlatformAdminService, PlatformMetrics } from './platform.service';

@Component({
  selector: 'app-platform-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="platform-dashboard p-6 max-w-7xl mx-auto">
      <header class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Console Plateforme — Administration</h1>
          <p class="text-sm text-gray-600">Surveillance globale des tenants, métriques SaaS et exploitation</p>
        </div>
        <div class="flex gap-3">
          <a routerLink="/app/platform/tenants" class="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700">Gérer les tenants</a>
          <a routerLink="/app/platform/announcements" class="px-4 py-2 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50">Annonces</a>
        </div>
      </header>

      @if (metrics(); as m) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Exploitations (Tenants)</h2>
            <p class="text-3xl font-extrabold text-gray-900 mt-2">{{ m.totalTenants }}</p>
            <p class="text-sm text-green-600 mt-1">{{ m.activeTenants }} actives</p>
          </div>
          <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Animaux suivis</h2>
            <p class="text-3xl font-extrabold text-gray-900 mt-2">{{ m.totalAnimals }}</p>
            <p class="text-sm text-gray-500 mt-1">sur {{ m.totalFarms }} fermes</p>
          </div>
          <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenu Mensuel Récurrent (MRR)</h2>
            <p class="text-3xl font-extrabold text-indigo-600 mt-2">{{ (m.monthlyRecurringRevenueCents / 100) | number:'1.0-0' }} XOF</p>
            <p class="text-sm text-gray-500 mt-1">{{ m.totalUsers }} utilisateurs inscrits</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class PlatformDashboardPage implements OnInit {
  private readonly platform = inject(PlatformAdminService);
  readonly metrics = signal<PlatformMetrics | null>(null);

  ngOnInit(): void {
    this.platform.getMetrics().subscribe({
      next: (data) => this.metrics.set(data),
      error: () => undefined,
    });
  }
}
