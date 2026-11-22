import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

export interface Expense {
  id: string;
  farmId: string;
  category: string;
  amount: number;
  currency: string;
  incurredAt: string;
  description: string | null;
  supplier: string | null;
}

export interface Revenue {
  id: string;
  farmId: string;
  category: string;
  amount: number;
  currency: string;
  receivedAt: string;
  description: string | null;
}

export interface LotCost {
  lotId: string;
  feedCost: number;
  allocatedCost: number;
  totalCost: number;
}

export interface LotMargin {
  lotId: string;
  revenue: number;
  cost: number;
  margin: number;
  marginRate: number | null;
}

export interface ExpenseRequest {
  category: string;
  amount: number;
  currency?: string | null;
  incurredAt: string;
  description?: string | null;
  supplier?: string | null;
  lotId?: string | null;
}

export interface RevenueRequest {
  category: string;
  amount: number;
  currency?: string | null;
  receivedAt: string;
  description?: string | null;
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly api = inject(ApiClient);

  expenses(query: Record<string, unknown> = {}): Observable<Expense[]> {
    return this.api.get<Expense[]>('expenses', query);
  }

  createExpense(request: ExpenseRequest): Observable<Expense> {
    return this.api.post<Expense>('expenses', request, this.api.newIdempotencyKey());
  }

  revenues(query: Record<string, unknown> = {}): Observable<Revenue[]> {
    return this.api.get<Revenue[]>('revenues', query);
  }

  createRevenue(request: RevenueRequest): Observable<Revenue> {
    return this.api.post<Revenue>('revenues', request, this.api.newIdempotencyKey());
  }

  lotCost(lotId: string): Observable<LotCost> {
    return this.api.get<LotCost>(`lots/${lotId}/cost`);
  }

  lotMargin(lotId: string): Observable<LotMargin> {
    return this.api.get<LotMargin>(`lots/${lotId}/margin`);
  }
}
