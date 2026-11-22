import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { CursorQuery, PageResponse } from './page-response';

export interface Animal {
  id: string;
  farmId: string;
  speciesId: string;
  breedId: string | null;
  penId: string | null;
  identifier: string;
  name: string | null;
  sex: string;
  birthDate: string | null;
  birthEstimated: boolean;
  origin: string | null;
  status: string;
  motherId: string | null;
  fatherId: string | null;
  photoKey: string | null;
  weightKg: number | null;
  acquiredAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface AnimalRequest {
  farmId: string;
  speciesId: string;
  breedId?: string | null;
  penId?: string | null;
  identifier: string;
  name?: string | null;
  sex: string;
  birthDate?: string | null;
  birthEstimated?: boolean;
  origin?: string | null;
  motherId?: string | null;
  fatherId?: string | null;
  weightKg?: number | null;
  acquiredAt?: string | null;
}

export interface AnimalStatusEntry {
  id: string;
  animalId: string;
  status: string;
  changedAt: string;
  reason: string | null;
  actorId: string | null;
}

export interface AnimalStatusRequest {
  status: string;
  reason?: string | null;
  occurredAt?: string | null;
}

export interface IndividualizeRequest {
  identifier: string;
  sex: string;
  birthDate?: string | null;
}

export interface Lot {
  id: string;
  farmId: string;
  speciesId: string;
  name: string;
  code: string | null;
  productionType: string | null;
  status: string;
  entryDate: string | null;
  initialCount: number;
  currentCount: number;
  origin: string | null;
  unitCost: number | null;
  closedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface LotRequest {
  farmId: string;
  speciesId: string;
  name: string;
  code?: string | null;
  productionType?: string | null;
  entryDate?: string | null;
  initialCount: number;
  unitCost?: number | null;
}

export interface LotMovement {
  id: string;
  lotId: string;
  type: string;
  quantity: number;
  occurredAt: string;
  reason: string | null;
  actorId: string | null;
  createdAt: string;
}

export interface LotMovementRequest {
  type: string;
  quantity: number;
  occurredAt: string;
  reason?: string | null;
}

export interface LotClosure {
  lotId: string;
  mortalityRate: number | null;
  feedConversion: number | null;
  gmq: number | null;
  cost: number | null;
  revenue: number | null;
  margin: number | null;
  closedAt: string;
}

@Injectable({ providedIn: 'root' })
export class HerdService {
  private readonly api = inject(ApiClient);

  animals(query: CursorQuery = {}): Observable<PageResponse<Animal>> {
    return this.api.getPage<Animal>('animals', query);
  }

  animal(id: string): Observable<Animal> {
    return this.api.get<Animal>(`animals/${id}`);
  }

  createAnimal(request: AnimalRequest): Observable<Animal> {
    return this.api.post<Animal>('animals', request, this.api.newIdempotencyKey());
  }

  patchAnimal(id: string, request: Partial<AnimalRequest>): Observable<Animal> {
    return this.api.patch<Animal>(`animals/${id}`, request);
  }

  changeStatus(id: string, request: AnimalStatusRequest): Observable<AnimalStatusEntry> {
    return this.api.post<AnimalStatusEntry>(`animals/${id}/status`, request);
  }

  statusHistory(id: string): Observable<AnimalStatusEntry[]> {
    return this.api.get<AnimalStatusEntry[]>(`animals/${id}/status-history`);
  }

  individualize(lotId: string, request: IndividualizeRequest): Observable<Animal> {
    return this.api.post<Animal>(
      `animals/${lotId}/individualize`,
      request,
      this.api.newIdempotencyKey(),
    );
  }

  lots(query: CursorQuery = {}): Observable<PageResponse<Lot>> {
    return this.api.getPage<Lot>('lots', query);
  }

  lot(id: string): Observable<Lot> {
    return this.api.get<Lot>(`lots/${id}`);
  }

  createLot(request: LotRequest): Observable<Lot> {
    return this.api.post<Lot>('lots', request, this.api.newIdempotencyKey());
  }

  patchLot(id: string, request: Partial<LotRequest>): Observable<Lot> {
    return this.api.patch<Lot>(`lots/${id}`, request);
  }

  lotMovements(id: string): Observable<LotMovement[]> {
    return this.api.get<LotMovement[]>(`lots/${id}/movements`);
  }

  moveLot(id: string, request: LotMovementRequest): Observable<LotMovement> {
    return this.api.post<LotMovement>(`lots/${id}/movements`, request);
  }

  closeLot(id: string): Observable<LotClosure> {
    return this.api.post<LotClosure>(`lots/${id}/close`, null);
  }

  splitLot(id: string, request: { name: string; quantity: number }): Observable<Lot> {
    return this.api.post<Lot>(`lots/${id}/split`, request, this.api.newIdempotencyKey());
  }

  mergeLot(id: string, sourceLotId: string): Observable<Lot> {
    return this.api.post<Lot>(`lots/${id}/merge`, { sourceLotId });
  }
}
