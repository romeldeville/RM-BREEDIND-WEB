import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';

export interface PlatformTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  planCode: string;
  farmsCount: number;
  animalsCount: number;
  createdAt: string;
}

export interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  totalFarms: number;
  totalAnimals: number;
  totalUsers: number;
  monthlyRecurringRevenueCents: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  severity: string;
  startsAt: string;
  endsAt?: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlatformAdminService {
  private readonly api = inject(ApiClient);

  getMetrics(): Observable<PlatformMetrics> {
    return this.api.get<PlatformMetrics>('platform/metrics');
  }

  listTenants(search?: string): Observable<PlatformTenant[]> {
    return this.api.get<PlatformTenant[]>('platform/tenants', { search });
  }

  getTenant(tenantId: string): Observable<PlatformTenant> {
    return this.api.get<PlatformTenant>(`platform/tenants/${tenantId}`);
  }

  suspendTenant(tenantId: string): Observable<void> {
    return this.api.post<void>(`platform/tenants/${tenantId}/suspend`, {});
  }

  reactivateTenant(tenantId: string): Observable<void> {
    return this.api.post<void>(`platform/tenants/${tenantId}/reactivate`, {});
  }

  listAnnouncements(): Observable<Announcement[]> {
    return this.api.get<Announcement[]>('platform/announcements');
  }

  createAnnouncement(announcement: Partial<Announcement>): Observable<Announcement> {
    return this.api.post<Announcement>('platform/announcements', announcement);
  }
}
