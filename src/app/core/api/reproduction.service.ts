import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { Lot } from './herd.service';
import { CursorQuery, PageResponse } from './page-response';

export interface ReproductionCycle {
  id: string;
  farmId: string;
  femaleId: string;
  status: string;
  parity: number;
  startDate: string;
  endDate: string | null;
  expectedBirthDate: string | null;
  expectedDiagnosisDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Heat {
  id: string;
  cycleId: string;
  animalId: string;
  observedAt: string;
  intensity: string | null;
  nextExpectedAt: string | null;
  notes: string | null;
}

export interface Mating {
  id: string;
  cycleId: string;
  femaleId: string;
  maleId: string | null;
  semenCode: string | null;
  method: string | null;
  matedAt: string;
  expectedBirthDate: string | null;
  expectedDiagnosisDate: string | null;
  notes: string | null;
}

export interface PregnancyDiagnosis {
  id: string;
  cycleId: string;
  diagnosedAt: string;
  result: string;
  nextDiagnosisAt: string | null;
  notes: string | null;
}

export interface Abortion {
  id: string;
  cycleId: string;
  occurredAt: string;
  stage: string | null;
  suspectedCause: string | null;
}

export interface Birth {
  id: string;
  cycleId: string;
  femaleId: string;
  occurredAt: string;
  bornAlive: number;
  stillborn: number;
  mummified: number;
  litterWeight: number | null;
  assistance: boolean;
  complications: string | null;
  litterId: string | null;
}

export interface BirthCreation {
  birth: Birth;
  litterId: string;
  retroactiveMatingSuggested: boolean;
  suggestedMatingDate: string | null;
}

export interface Weaning {
  id: string;
  litterId: string;
  weanedAt: string;
  count: number;
  averageWeight: number | null;
}

export interface Litter {
  id: string;
  birthId: string;
  lotId: string | null;
  name: string;
  bornAlive: number;
  weanedCount: number | null;
  weaningDate: string | null;
  weanings: Weaning[];
}

export interface CycleDetail {
  cycle: ReproductionCycle;
  heats: Heat[];
  matings: Mating[];
  diagnoses: PregnancyDiagnosis[];
  abortions: Abortion[];
  births: Birth[];
  litters: Litter[];
}

export interface CycleRequest {
  femaleId: string;
  startDate?: string | null;
}

export interface HeatRequest {
  animalId: string;
  observedAt: string;
  intensity?: string | null;
  notes?: string | null;
}

export interface MatingRequest {
  femaleId: string;
  maleId?: string | null;
  semenCode?: string | null;
  method?: string | null;
  matedAt: string;
  notes?: string | null;
}

export interface DiagnosisRequest {
  cycleId: string;
  diagnosedAt: string;
  result: string;
  notes?: string | null;
}

export interface AbortionRequest {
  cycleId: string;
  occurredAt: string;
  stage?: string | null;
  suspectedCause?: string | null;
}

export interface BirthRequest {
  cycleId: string;
  femaleId: string;
  occurredAt: string;
  bornAlive: number;
  stillborn?: number;
  mummified?: number;
  litterWeight?: number | null;
  assistance?: boolean;
  complications?: string | null;
}

export interface WeaningRequest {
  litterId: string;
  weanedAt: string;
  count: number;
  averageWeight?: number | null;
}

export interface LitterLotRequest {
  name: string;
  code?: string | null;
  productionType?: string | null;
  unitCost?: number | null;
}

@Injectable({ providedIn: 'root' })
export class ReproductionService {
  private readonly api = inject(ApiClient);

  cycles(query: CursorQuery = {}): Observable<PageResponse<ReproductionCycle>> {
    return this.api.getPage<ReproductionCycle>('reproduction/cycles', query);
  }

  createCycle(request: CycleRequest): Observable<ReproductionCycle> {
    return this.api.post<ReproductionCycle>(
      'reproduction/cycles',
      request,
      this.api.newIdempotencyKey(),
    );
  }

  cycle(id: string): Observable<CycleDetail> {
    return this.api.get<CycleDetail>(`reproduction/cycles/${id}`);
  }

  recordHeat(request: HeatRequest): Observable<Heat> {
    return this.api.post<Heat>('reproduction/heats', request, this.api.newIdempotencyKey());
  }

  recordMating(request: MatingRequest): Observable<Mating> {
    return this.api.post<Mating>('reproduction/services', request, this.api.newIdempotencyKey());
  }

  recordDiagnosis(request: DiagnosisRequest): Observable<PregnancyDiagnosis> {
    return this.api.post<PregnancyDiagnosis>(
      'reproduction/diagnoses',
      request,
      this.api.newIdempotencyKey(),
    );
  }

  recordAbortion(request: AbortionRequest): Observable<Abortion> {
    return this.api.post<Abortion>('reproduction/abortions', request, this.api.newIdempotencyKey());
  }

  recordBirth(request: BirthRequest): Observable<BirthCreation> {
    return this.api.post<BirthCreation>(
      'reproduction/farrowings',
      request,
      this.api.newIdempotencyKey(),
    );
  }

  recordWeaning(request: WeaningRequest): Observable<Weaning> {
    return this.api.post<Weaning>('reproduction/weanings', request, this.api.newIdempotencyKey());
  }

  createLotFromLitter(litterId: string, request: LitterLotRequest): Observable<Lot> {
    return this.api.post<Lot>(
      `reproduction/litters/${litterId}/lot`,
      request,
      this.api.newIdempotencyKey(),
    );
  }
}
