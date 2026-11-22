import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

export interface Feed {
  id: string;
  name: string;
  type: string | null;
  unit: string;
  price: number | null;
  supplier: string | null;
  archivedAt: string | null;
}

export interface FeedReceipt {
  id: string;
  feedId: string;
  quantity: number;
  unitPrice: number | null;
  receivedAt: string;
  supplier: string | null;
  expiryDate: string | null;
  notes: string | null;
}

export interface FeedDistribution {
  id: string;
  feedId: string;
  lotId: string | null;
  animalId: string | null;
  quantity: number;
  distributedAt: string;
  actorId: string | null;
  planId: string | null;
  notes: string | null;
}

export interface FeedStock {
  feedId: string;
  feedName: string | null;
  unit: string | null;
  quantity: number;
  averagePrice: number | null;
  updatedAt: string | null;
}

export interface LowStockAlert {
  feedId: string;
  feedName: string | null;
  unit: string | null;
  quantity: number;
  threshold: number;
}

export interface FeedingPlan {
  id: string;
  speciesId: string;
  name: string;
  stages: Record<string, unknown>[];
  active: boolean;
}

export interface FeedCost {
  id: string;
  lotId: string | null;
  animalId: string | null;
  amount: number;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface FeedRequest {
  name: string;
  type?: string | null;
  unit: string;
  price?: number | null;
  supplier?: string | null;
}

export interface FeedReceiptRequest {
  quantity: number;
  unitPrice?: number | null;
  receivedAt: string;
  supplier?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
}

export interface FeedDistributionRequest {
  feedId: string;
  lotId?: string | null;
  animalId?: string | null;
  quantity: number;
  distributedAt: string;
  planId?: string | null;
  notes?: string | null;
}

export interface FeedCostRequest {
  lotId?: string | null;
  animalId?: string | null;
  from: string;
  to: string;
}

@Injectable({ providedIn: 'root' })
export class FeedingService {
  private readonly api = inject(ApiClient);

  feeds(query: Record<string, unknown> = {}): Observable<Feed[]> {
    return this.api.get<Feed[]>('feeds', query);
  }

  createFeed(request: FeedRequest): Observable<Feed> {
    return this.api.post<Feed>('feeds', request, this.api.newIdempotencyKey());
  }

  receipts(feedId: string): Observable<FeedReceipt[]> {
    return this.api.get<FeedReceipt[]>(`feeds/${feedId}/receipts`);
  }

  receiveFeed(feedId: string, request: FeedReceiptRequest): Observable<FeedReceipt> {
    return this.api.post<FeedReceipt>(
      `feeds/${feedId}/receipts`,
      request,
      this.api.newIdempotencyKey(),
    );
  }

  distributions(query: Record<string, unknown> = {}): Observable<FeedDistribution[]> {
    return this.api.get<FeedDistribution[]>('feed-distributions', query);
  }

  distribute(request: FeedDistributionRequest): Observable<FeedDistribution> {
    return this.api.post<FeedDistribution>(
      'feed-distributions',
      request,
      this.api.newIdempotencyKey(),
    );
  }

  stocks(): Observable<FeedStock[]> {
    return this.api.get<FeedStock[]>('feed-stocks');
  }

  lowStock(query: Record<string, unknown> = {}): Observable<LowStockAlert[]> {
    return this.api.get<LowStockAlert[]>('feed-stocks/low', query);
  }

  feedingPlans(query: Record<string, unknown> = {}): Observable<FeedingPlan[]> {
    return this.api.get<FeedingPlan[]>('feeding-plans', query);
  }

  costs(): Observable<FeedCost[]> {
    return this.api.get<FeedCost[]>('feed-costs');
  }

  computeCost(request: FeedCostRequest): Observable<FeedCost> {
    return this.api.post<FeedCost>('feed-costs', request, this.api.newIdempotencyKey());
  }
}
