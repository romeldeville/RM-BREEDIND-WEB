import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformAdminService, PlatformTenant } from './platform.service';

@Component({
  selector: 'app-platform-tenants-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="platform-tenants p-6 max-w-7xl mx-auto">
      <header class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestion des Exploitations (Tenants)</h1>
          <p class="text-sm text-gray-600">Recherche, consultation, suspension et modification de forfaits</p>
        </div>
        <div class="flex gap-3">
          <input [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Rechercher par nom..." class="px-3 py-2 border rounded text-sm w-64" />
        </div>
      </header>

      <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th class="px-6 py-3 text-left">Nom de l'exploitation</th>
              <th class="px-6 py-3 text-left">Forfait</th>
              <th class="px-6 py-3 text-left">Fermes / Animaux</th>
              <th class="px-6 py-3 text-left">Statut</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            @for (t of tenants(); track t.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 font-semibold text-gray-900">{{ t.name }} <span class="text-xs text-gray-400 block">{{ t.slug }}</span></td>
                <td class="px-6 py-4"><span class="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{{ t.planCode }}</span></td>
                <td class="px-6 py-4 text-gray-600">{{ t.farmsCount }} ferme(s) • {{ t.animalsCount }} animaux</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded text-xs font-semibold"
                        [ngClass]="t.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ t.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  @if (t.status === 'ACTIVE') {
                    <button (click)="suspend(t)" class="text-red-600 hover:text-red-800 font-medium text-xs mr-3">Suspendre</button>
                  } @else {
                    <button (click)="reactivate(t)" class="text-green-600 hover:text-green-800 font-medium text-xs mr-3">Réactiver</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class PlatformTenantsPage implements OnInit {
  private readonly platform = inject(PlatformAdminService);
  readonly tenants = signal<PlatformTenant[]>([]);
  searchQuery = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.platform.listTenants(this.searchQuery).subscribe({
      next: (list) => this.tenants.set(list),
      error: () => undefined,
    });
  }

  onSearch(): void {
    this.load();
  }

  suspend(tenant: PlatformTenant): void {
    this.platform.suspendTenant(tenant.id).subscribe({
      next: () => this.load(),
      error: () => undefined,
    });
  }

  reactivate(tenant: PlatformTenant): void {
    this.platform.reactivateTenant(tenant.id).subscribe({
      next: () => this.load(),
      error: () => undefined,
    });
  }
}
