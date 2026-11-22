import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

export interface Weighing {
  id: string;
  animalId: string | null;
  lotId: string | null;
  weighedAt: string;
  weightKg: number;
  sampleCount: number | null;
  averageWeight: number | null;
}

export interface Gmq {
  animalId: string | null;
  lotId: string | null;
  from: string;
  to: string;
  days: number;
  startWeightKg: number;
  endWeightKg: number;
  gmq: number;
}

export interface GrowthPoint {
  weighedAt: string;
  weightKg: number;
  ageDays: number | null;
}

export interface GrowthCurve {
  animalId: string | null;
  lotId: string | null;
  speciesId: string | null;
  points: GrowthPoint[];
  reference: Record<string, unknown>[];
}

export interface EggCollection {
  id: string;
  farmId: string;
  lotId: string | null;
  collectedAt: string;
  collected: number;
  broken: number;
  downgraded: number;
  sellable: number;
}

export interface EggMovement {
  id: string;
  farmId: string;
  lotId: string | null;
  type: string;
  quantity: number;
  occurredAt: string;
  reason: string | null;
}

export interface EggStock {
  farmId: string;
  lotId: string | null;
  quantity: number;
  updatedAt: string | null;
}

export interface LayingRate {
  lotId: string;
  from: string;
  to: string;
  days: number;
  henCount: number;
  totalCollected: number;
  layingRate: number;
}

export interface WeighingRequest {
  animalId?: string | null;
  lotId?: string | null;
  weighedAt: string;
  weightKg: number;
  sampleCount?: number | null;
  averageWeight?: number | null;
}

export interface EggCollectionRequest {
  lotId: string;
  collectedAt: string;
  collected: number;
  broken?: number | null;
  downgraded?: number | null;
}

export interface EggMovementRequest {
  lotId: string;
  type: string;
  quantity: number;
  occurredAt: string;
  reason?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProductionService {
  private readonly api = inject(ApiClient);

  weighings(query: Record<string, unknown> = {}): Observable<Weighing[]> {
    return this.api.get<Weighing[]>('production/weighings', query);
  }

  createWeighing(request: WeighingRequest): Observable<Weighing> {
    return this.api.post<Weighing>('production/weighings', request, this.api.newIdempotencyKey());
  }

  gmq(query: Record<string, unknown> = {}): Observable<Gmq> {
    return this.api.get<Gmq>('production/weighings/gmq', query);
  }

  growthCurve(query: Record<string, unknown> = {}): Observable<GrowthCurve> {
    return this.api.get<GrowthCurve>('production/growth-curve', query);
  }

  collections(query: Record<string, unknown> = {}): Observable<EggCollection[]> {
    return this.api.get<EggCollection[]>('production/egg-collections', query);
  }

  createCollection(request: EggCollectionRequest): Observable<EggCollection> {
    return this.api.post<EggCollection>(
      'production/egg-collections',
      request,
      this.api.newIdempotencyKey(),
    );
  }

  movements(query: Record<string, unknown> = {}): Observable<EggMovement[]> {
    return this.api.get<EggMovement[]>('production/egg-movements', query);
  }

  createMovement(request: EggMovementRequest): Observable<EggMovement> {
    return this.api.post<EggMovement>(
      'production/egg-movements',
      request,
      this.api.newIdempotencyKey(),
    );
  }

  eggStocks(): Observable<EggStock[]> {
    return this.api.get<EggStock[]>('production/egg-stocks');
  }

  layingRate(query: Record<string, unknown>): Observable<LayingRate> {
    return this.api.get<LayingRate>('production/laying-rate', query);
  }
}
