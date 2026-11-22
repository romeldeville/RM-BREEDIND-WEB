import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

export interface Customer {
  id: string;
  farmId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number;
  archivedAt: string | null;
}

export interface SaleLine {
  id: string;
  itemType: string;
  animalId: string | null;
  lotId: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Sale {
  id: string;
  farmId: string;
  customerId: string | null;
  number: string;
  type: string;
  status: string;
  soldAt: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  notes: string | null;
  cancellationDeadline: string | null;
  lines: SaleLine[];
}

export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
  reference: string | null;
}

export interface CustomerRequest {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface SaleLineRequest {
  itemType: string;
  animalId?: string | null;
  lotId?: string | null;
  description?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface SaleRequest {
  customerId?: string | null;
  type: string;
  soldAt: string;
  currency?: string | null;
  notes?: string | null;
  lines: SaleLineRequest[];
}

export interface PaymentRequest {
  amount: number;
  method: string;
  paidAt: string;
  reference?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly api = inject(ApiClient);

  customers(query: Record<string, unknown> = {}): Observable<Customer[]> {
    return this.api.get<Customer[]>('customers', query);
  }

  createCustomer(request: CustomerRequest): Observable<Customer> {
    return this.api.post<Customer>('customers', request, this.api.newIdempotencyKey());
  }

  sales(query: Record<string, unknown> = {}): Observable<Sale[]> {
    return this.api.get<Sale[]>('sales', query);
  }

  sale(saleId: string): Observable<Sale> {
    return this.api.get<Sale>(`sales/${saleId}`);
  }

  createSale(request: SaleRequest): Observable<Sale> {
    return this.api.post<Sale>('sales', request, this.api.newIdempotencyKey());
  }

  cancelSale(saleId: string, reason: string): Observable<Sale> {
    return this.api.post<Sale>(`sales/${saleId}/cancel`, { reason });
  }

  payments(saleId: string): Observable<Payment[]> {
    return this.api.get<Payment[]>(`sales/${saleId}/payments`);
  }

  addPayment(saleId: string, request: PaymentRequest): Observable<Payment> {
    return this.api.post<Payment>(`sales/${saleId}/payments`, request, this.api.newIdempotencyKey());
  }
}
