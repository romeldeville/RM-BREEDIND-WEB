import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformAdminService, Announcement } from './platform.service';

@Component({
  selector: 'app-platform-announcements-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="platform-announcements p-6 max-w-5xl mx-auto">
      <header class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Annonces et Maintenances Plateforme</h1>
          <p class="text-sm text-gray-600">Diffusion de messages d'information et de maintenance aux éleveurs</p>
        </div>
      </header>

      <div class="bg-white p-5 rounded-lg border border-gray-200 mb-8 shadow-sm">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Nouvelle annonce</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Titre</label>
            <input [(ngModel)]="newTitle" placeholder="Ex: Maintenance programmée dimanche" class="w-full px-3 py-2 border rounded text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Sévérité</label>
            <select [(ngModel)]="newSeverity" class="w-full px-3 py-2 border rounded text-sm">
              <option value="INFO">Information</option>
              <option value="WARNING">Avertissement</option>
              <option value="CRITICAL">Critique (Maintenance)</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 mb-1">Message</label>
            <textarea [(ngModel)]="newMessage" rows="3" placeholder="Détails du message diffusé..." class="w-full px-3 py-2 border rounded text-sm"></textarea>
          </div>
        </div>
        <div class="mt-4 text-right">
          <button (click)="publish()" [disabled]="!newTitle || !newMessage" class="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            Publier l'annonce
          </button>
        </div>
      </div>

      <div class="space-y-4">
        @for (a of announcements(); track a.id) {
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-xs font-semibold"
                      [ngClass]="a.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : (a.severity === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800')">
                  {{ a.severity }}
                </span>
                <h3 class="font-bold text-gray-900 text-sm">{{ a.title }}</h3>
              </div>
              <p class="text-sm text-gray-700">{{ a.message }}</p>
              <span class="text-xs text-gray-400 mt-2 block">Diffusé depuis le {{ a.startsAt | date:'short' }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class PlatformAnnouncementsPage implements OnInit {
  private readonly platform = inject(PlatformAdminService);
  readonly announcements = signal<Announcement[]>([]);

  newTitle = '';
  newSeverity = 'INFO';
  newMessage = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.platform.listAnnouncements().subscribe({
      next: (list) => this.announcements.set(list),
      error: () => undefined,
    });
  }

  publish(): void {
    this.platform.createAnnouncement({
      title: this.newTitle,
      severity: this.newSeverity,
      message: this.newMessage,
    }).subscribe({
      next: () => {
        this.newTitle = '';
        this.newMessage = '';
        this.load();
      },
      error: () => undefined,
    });
  }
}
