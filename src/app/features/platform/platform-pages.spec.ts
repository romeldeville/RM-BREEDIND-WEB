import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { Announcement, PlatformAdminService, PlatformMetrics, PlatformTenant } from './platform.service';
import { PlatformDashboardPage } from './platform-dashboard.page';
import { PlatformTenantsPage } from './platform-tenants.page';
import { PlatformAnnouncementsPage } from './platform-announcements.page';

const METRICS: PlatformMetrics = {
  totalTenants: 12,
  activeTenants: 11,
  totalFarms: 15,
  totalAnimals: 1450,
  totalUsers: 34,
  monthlyRecurringRevenueCents: 42000000,
};

const TENANTS: PlatformTenant[] = [
  {
    id: 'tenant-1',
    name: 'Ferme Avicole du Sahel',
    slug: 'ferme-avicole-sahel',
    status: 'ACTIVE',
    planCode: 'PRO',
    farmsCount: 2,
    animalsCount: 450,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'tenant-2',
    name: 'Porcherie de la Vallée',
    slug: 'porcherie-vallee',
    status: 'SUSPENDED',
    planCode: 'STARTER',
    farmsCount: 1,
    animalsCount: 80,
    createdAt: '2026-02-15T14:30:00Z',
  },
];

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Mise à jour v1.2',
    message: 'Déploiement des nouvelles fonctionnalités de reproduction.',
    severity: 'INFO',
    startsAt: '2026-11-16T08:00:00Z',
    active: true,
  },
];

const PLATFORM_SERVICE_STUB = {
  getMetrics: () => of(METRICS),
  listTenants: () => of(TENANTS),
  getTenant: (id: string) => of(TENANTS.find((t) => t.id === id) || TENANTS[0]),
  suspendTenant: () => of(undefined),
  reactivateTenant: () => of(undefined),
  listAnnouncements: () => of(ANNOUNCEMENTS),
  createAnnouncement: () => of(ANNOUNCEMENTS[0]),
};

describe('Platform Admin Pages', () => {
  it('renders PlatformDashboardPage with metrics', async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformDashboardPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: PlatformAdminService, useValue: PLATFORM_SERVICE_STUB },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PlatformDashboardPage);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Console Plateforme — Administration');
    expect(text).toContain('12');
    expect(text).toContain('11 actives');
    expect(text).toContain('1450');
  });

  it('renders PlatformTenantsPage with list of tenants', async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformTenantsPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: PlatformAdminService, useValue: PLATFORM_SERVICE_STUB },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PlatformTenantsPage);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Gestion des Exploitations (Tenants)');
    expect(text).toContain('Ferme Avicole du Sahel');
    expect(text).toContain('Porcherie de la Vallée');
    expect(text).toContain('ACTIVE');
    expect(text).toContain('SUSPENDED');
  });

  it('renders PlatformAnnouncementsPage with announcements list', async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformAnnouncementsPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: PlatformAdminService, useValue: PLATFORM_SERVICE_STUB },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PlatformAnnouncementsPage);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Annonces et Maintenances Plateforme');
    expect(text).toContain('Mise à jour v1.2');
    expect(text).toContain('Déploiement des nouvelles fonctionnalités de reproduction.');
  });
});
