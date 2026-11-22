import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

export interface Species {
  id: string;
  name: string;
  code: string;
  productionType: string;
  trackingMode: string;
  gestationDays: number | null;
  heatCycleDays: number | null;
  weaningAgeDays: number | null;
  incubationDays: number | null;
  settings: Record<string, unknown>;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpeciesRequest {
  name: string;
  code: string;
  productionType: string;
  trackingMode: string;
  gestationDays?: number | null;
  heatCycleDays?: number | null;
  weaningAgeDays?: number | null;
  incubationDays?: number | null;
  settings?: Record<string, unknown>;
}

export interface SpeciesTemplate {
  id: string;
  speciesId: string;
  name: string;
  config: Record<string, unknown>;
}

export interface Breed {
  id: string;
  speciesId: string;
  name: string;
  code: string | null;
  archivedAt: string | null;
}

export interface VaccinationPlan {
  id: string;
  speciesId: string;
  name: string;
  productId: string | null;
  ageDays: number | null;
  boosterDays: number | null;
  schedule: Record<string, unknown>[];
  active: boolean;
}

export interface FeedingPlan {
  id: string;
  speciesId: string;
  name: string;
  stages: Record<string, unknown>[];
  active: boolean;
}

export interface GrowthCurve {
  id: string;
  speciesId: string;
  breedId: string | null;
  name: string | null;
  points: Record<string, unknown>[];
}

export interface Farm {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  country: string | null;
  currency: string | null;
  timezone: string | null;
}

export interface Building {
  id: string;
  farmId: string;
  name: string;
  code: string | null;
  type: string | null;
  archivedAt: string | null;
}

export interface Pen {
  id: string;
  farmId: string;
  buildingId: string;
  name: string;
  code: string | null;
  type: string | null;
  capacity: number;
  archivedAt: string | null;
}

export interface PenOccupancy {
  penId: string;
  capacity: number;
  occupied: number;
}

export interface PenMovement {
  id: string;
  animalId: string | null;
  lotId: string | null;
  fromPenId: string | null;
  toPenId: string;
  movedAt: string;
  reason: string | null;
}

export interface BuildingRequest {
  farmId: string;
  name: string;
  code?: string | null;
  type?: string | null;
}

export interface PenRequest {
  buildingId: string;
  name: string;
  code?: string | null;
  type?: string | null;
  capacity: number;
}

@Injectable({ providedIn: 'root' })
export class ReferentialService {
  private readonly api = inject(ApiClient);

  species(includeArchived = false): Observable<Species[]> {
    return this.api.get<Species[]>('species', { includeArchived });
  }

  speciesById(id: string): Observable<Species> {
    return this.api.get<Species>(`species/${id}`);
  }

  createSpecies(request: SpeciesRequest): Observable<Species> {
    return this.api.post<Species>('species', request, this.api.newIdempotencyKey());
  }

  patchSpecies(id: string, request: Partial<SpeciesRequest>): Observable<Species> {
    return this.api.patch<Species>(`species/${id}`, request);
  }

  archiveSpecies(id: string): Observable<void> {
    return this.api.delete<void>(`species/${id}`);
  }

  templates(speciesId: string): Observable<SpeciesTemplate[]> {
    return this.api.get<SpeciesTemplate[]>(`species/${speciesId}/templates`);
  }

  createTemplate(speciesId: string, request: { name: string; config?: Record<string, unknown> }) {
    return this.api.post<SpeciesTemplate>(`species/${speciesId}/templates`, request);
  }

  deleteTemplate(templateId: string): Observable<void> {
    return this.api.delete<void>(`species/templates/${templateId}`);
  }

  breeds(speciesId: string): Observable<Breed[]> {
    return this.api.get<Breed[]>(`species/${speciesId}/breeds`);
  }

  createBreed(speciesId: string, request: { name: string; code?: string | null }) {
    return this.api.post<Breed>(`species/${speciesId}/breeds`, request);
  }

  updateBreed(breedId: string, request: { name: string; code?: string | null }) {
    return this.api.patch<Breed>(`species/breeds/${breedId}`, request);
  }

  archiveBreed(breedId: string): Observable<void> {
    return this.api.delete<void>(`species/breeds/${breedId}`);
  }

  vaccinationPlans(speciesId: string): Observable<VaccinationPlan[]> {
    return this.api.get<VaccinationPlan[]>(`species/${speciesId}/vaccination-plans`);
  }

  createVaccinationPlan(
    speciesId: string,
    request: {
      name: string;
      ageDays?: number | null;
      boosterDays?: number | null;
      active?: boolean;
    },
  ) {
    return this.api.post<VaccinationPlan>(`species/${speciesId}/vaccination-plans`, request);
  }

  deleteVaccinationPlan(planId: string): Observable<void> {
    return this.api.delete<void>(`species/vaccination-plans/${planId}`);
  }

  feedingPlans(speciesId: string): Observable<FeedingPlan[]> {
    return this.api.get<FeedingPlan[]>(`species/${speciesId}/feeding-plans`);
  }

  createFeedingPlan(
    speciesId: string,
    request: { name: string; stages?: Record<string, unknown>[]; active?: boolean },
  ) {
    return this.api.post<FeedingPlan>(`species/${speciesId}/feeding-plans`, request);
  }

  deleteFeedingPlan(planId: string): Observable<void> {
    return this.api.delete<void>(`species/feeding-plans/${planId}`);
  }

  growthCurves(speciesId: string): Observable<GrowthCurve[]> {
    return this.api.get<GrowthCurve[]>(`species/${speciesId}/growth-curves`);
  }

  farms(): Observable<Farm[]> {
    return this.api.get<Farm[]>('farms');
  }

  buildings(farmId: string): Observable<Building[]> {
    return this.api.get<Building[]>('buildings', { farmId });
  }

  createBuilding(request: BuildingRequest): Observable<Building> {
    return this.api.post<Building>('buildings', request);
  }

  patchBuilding(id: string, request: Partial<BuildingRequest>): Observable<Building> {
    return this.api.patch<Building>(`buildings/${id}`, request);
  }

  archiveBuilding(id: string): Observable<void> {
    return this.api.delete<void>(`buildings/${id}`);
  }

  pens(buildingId: string): Observable<Pen[]> {
    return this.api.get<Pen[]>('pens', { buildingId });
  }

  createPen(request: PenRequest): Observable<Pen> {
    return this.api.post<Pen>('pens', request);
  }

  patchPen(id: string, request: Partial<PenRequest>): Observable<Pen> {
    return this.api.patch<Pen>(`pens/${id}`, request);
  }

  archivePen(id: string): Observable<void> {
    return this.api.delete<void>(`pens/${id}`);
  }

  occupancy(penId: string): Observable<PenOccupancy> {
    return this.api.get<PenOccupancy>(`pens/${penId}/occupancy`);
  }

  penMovements(penId?: string): Observable<PenMovement[]> {
    return this.api.get<PenMovement[]>('pen-movements', penId ? { penId } : {});
  }
}
