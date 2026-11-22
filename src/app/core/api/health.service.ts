import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

export interface HealthProduct {
  id: string;
  name: string;
  type: string | null;
  speciesAllowed: string[] | null;
  dose: string | null;
  route: string | null;
  withdrawalMeatDays: number;
  withdrawalEggsDays: number;
  withdrawalMilkDays: number;
  shelfLifeDays: number | null;
  supplier: string | null;
  stockQty: number | null;
  archivedAt: string | null;
}

export interface Vaccination {
  id: string;
  animalId: string | null;
  lotId: string | null;
  productId: string;
  planId: string | null;
  vaccineLot: string | null;
  dose: string | null;
  route: string | null;
  count: number;
  performedAt: string;
  vetId: string | null;
  notes: string | null;
}

export interface TreatmentAdministration {
  id: string;
  treatmentId: string;
  administeredAt: string;
  dose: string | null;
  actorId: string | null;
}

export interface Treatment {
  id: string;
  animalId: string | null;
  lotId: string | null;
  productId: string;
  diagnosis: string | null;
  symptoms: string | null;
  dose: string | null;
  route: string | null;
  startDate: string;
  durationDays: number | null;
  endDate: string | null;
  status: string;
  notes: string | null;
  withdrawalEndDate: string | null;
  administrations: TreatmentAdministration[];
}

export interface Withdrawal {
  id: string;
  treatmentId: string;
  animalId: string | null;
  lotId: string | null;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface Mortality {
  id: string;
  animalId: string | null;
  lotId: string | null;
  count: number;
  cause: string | null;
  occurredAt: string;
  actorId: string | null;
}

export interface Quarantine {
  id: string;
  animalId: string | null;
  lotId: string | null;
  startDate: string;
  endDate: string | null;
  reason: string | null;
  status: string;
  releasedBy: string | null;
}

export interface SaleEligibility {
  allowed: boolean;
  blockingWithdrawals: Withdrawal[];
}

export interface ProductRequest {
  name: string;
  type?: string | null;
  dose?: string | null;
  route?: string | null;
  withdrawalMeatDays?: number | null;
  withdrawalEggsDays?: number | null;
  withdrawalMilkDays?: number | null;
  shelfLifeDays?: number | null;
  supplier?: string | null;
  stockQty?: number | null;
}

export interface VaccinationRequest {
  animalId?: string | null;
  lotId?: string | null;
  productId: string;
  planId?: string | null;
  vaccineLot?: string | null;
  dose?: string | null;
  route?: string | null;
  count?: number | null;
  performedAt: string;
  notes?: string | null;
}

export interface TreatmentRequest {
  animalId?: string | null;
  lotId?: string | null;
  productId: string;
  diagnosis?: string | null;
  symptoms?: string | null;
  dose?: string | null;
  route?: string | null;
  startDate: string;
  durationDays?: number | null;
  notes?: string | null;
}

export interface AdministrationRequest {
  administeredAt: string;
  dose?: string | null;
}

export interface MortalityRequest {
  animalId?: string | null;
  lotId?: string | null;
  count?: number | null;
  cause?: string | null;
  occurredAt: string;
}

export interface QuarantineRequest {
  animalId?: string | null;
  lotId?: string | null;
  startDate: string;
  endDate?: string | null;
  reason?: string | null;
}

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly api = inject(ApiClient);

  products(query: Record<string, unknown> = {}): Observable<HealthProduct[]> {
    return this.api.get<HealthProduct[]>('health/products', query);
  }

  createProduct(request: ProductRequest): Observable<HealthProduct> {
    return this.api.post<HealthProduct>('health/products', request, this.api.newIdempotencyKey());
  }

  vaccinations(query: Record<string, unknown> = {}): Observable<Vaccination[]> {
    return this.api.get<Vaccination[]>('health/vaccinations', query);
  }

  recordVaccination(request: VaccinationRequest): Observable<Vaccination> {
    return this.api.post<Vaccination>('health/vaccinations', request, this.api.newIdempotencyKey());
  }

  treatments(query: Record<string, unknown> = {}): Observable<Treatment[]> {
    return this.api.get<Treatment[]>('health/treatments', query);
  }

  createTreatment(request: TreatmentRequest): Observable<Treatment> {
    return this.api.post<Treatment>('health/treatments', request, this.api.newIdempotencyKey());
  }

  addAdministration(
    treatmentId: string,
    request: AdministrationRequest,
  ): Observable<TreatmentAdministration> {
    return this.api.post<TreatmentAdministration>(
      `health/treatments/${treatmentId}/administrations`,
      request,
      this.api.newIdempotencyKey(),
    );
  }

  withdrawals(query: Record<string, unknown> = {}): Observable<Withdrawal[]> {
    return this.api.get<Withdrawal[]>('health/withdrawals', query);
  }

  saleEligibility(query: Record<string, unknown> = {}): Observable<SaleEligibility> {
    return this.api.get<SaleEligibility>('health/sale-eligibility', query);
  }

  mortalities(query: Record<string, unknown> = {}): Observable<Mortality[]> {
    return this.api.get<Mortality[]>('health/mortalities', query);
  }

  recordMortality(request: MortalityRequest): Observable<Mortality> {
    return this.api.post<Mortality>('health/mortalities', request, this.api.newIdempotencyKey());
  }

  quarantines(query: Record<string, unknown> = {}): Observable<Quarantine[]> {
    return this.api.get<Quarantine[]>('health/quarantines', query);
  }

  createQuarantine(request: QuarantineRequest): Observable<Quarantine> {
    return this.api.post<Quarantine>('health/quarantines', request, this.api.newIdempotencyKey());
  }

  releaseQuarantine(id: string): Observable<Quarantine> {
    return this.api.post<Quarantine>(
      `health/quarantines/${id}/release`,
      {},
      this.api.newIdempotencyKey(),
    );
  }
}
