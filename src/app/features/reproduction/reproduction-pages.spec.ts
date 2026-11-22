import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Type } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Animal, HerdService, Lot } from '../../core/api/herd.service';
import {
  Birth,
  CycleDetail,
  Heat,
  Litter,
  Mating,
  PregnancyDiagnosis,
  ReproductionCycle,
  ReproductionService,
  Weaning,
} from '../../core/api/reproduction.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { BirthPage } from './birth.page';
import { CycleDetailPage } from './cycle-detail.page';
import { DiagnosisPage } from './diagnosis.page';
import { HeatPage } from './heat.page';
import { MatingPage } from './mating.page';
import { ReproductionPage } from './reproduction.page';
import { WeaningPage } from './weaning.page';

const FEMALE: Animal = {
  id: 'animal-1',
  farmId: 'farm-1',
  speciesId: 'species-1',
  breedId: null,
  penId: null,
  identifier: 'A-001',
  name: 'Bella',
  sex: 'FEMALE',
  birthDate: '2024-01-15',
  birthEstimated: false,
  origin: 'NAISSANCE',
  status: 'ACTIVE',
  motherId: null,
  fatherId: null,
  photoKey: null,
  weightKg: 420,
  acquiredAt: null,
  archivedAt: null,
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-02T10:00:00Z',
  version: 1,
};

const CYCLE: ReproductionCycle = {
  id: 'cycle-1',
  farmId: 'farm-1',
  femaleId: 'animal-1',
  status: 'PREGNANT',
  parity: 2,
  startDate: '2026-01-10',
  endDate: null,
  expectedBirthDate: '2026-10-22',
  expectedDiagnosisDate: '2026-02-10',
  createdAt: '2026-01-10T10:00:00Z',
  updatedAt: '2026-01-10T10:00:00Z',
};

const HEAT: Heat = {
  id: 'heat-1',
  cycleId: 'cycle-1',
  animalId: 'animal-1',
  observedAt: '2026-01-10T12:00:00Z',
  intensity: 'HIGH',
  nextExpectedAt: '2026-01-31',
  notes: null,
};

const MATING: Mating = {
  id: 'mating-1',
  cycleId: 'cycle-1',
  femaleId: 'animal-1',
  maleId: null,
  semenCode: 'SEM-1',
  method: 'AI',
  matedAt: '2026-01-11T12:00:00Z',
  expectedBirthDate: '2026-10-23',
  expectedDiagnosisDate: '2026-02-11',
  notes: null,
};

const DIAGNOSIS: PregnancyDiagnosis = {
  id: 'diagnosis-1',
  cycleId: 'cycle-1',
  diagnosedAt: '2026-02-10T12:00:00Z',
  result: 'POSITIVE',
  nextDiagnosisAt: null,
  notes: null,
};

const BIRTH: Birth = {
  id: 'birth-1',
  cycleId: 'cycle-1',
  femaleId: 'animal-1',
  occurredAt: '2026-10-22T12:00:00Z',
  bornAlive: 2,
  stillborn: 0,
  mummified: 0,
  litterWeight: 70,
  assistance: false,
  complications: null,
  litterId: 'litter-1',
};

const WEANING: Weaning = {
  id: 'weaning-1',
  litterId: 'litter-1',
  weanedAt: '2026-12-01T12:00:00Z',
  count: 2,
  averageWeight: 35,
};

const LITTER: Litter = {
  id: 'litter-1',
  birthId: 'birth-1',
  lotId: null,
  name: 'Portée 2026',
  bornAlive: 2,
  weanedCount: null,
  weaningDate: null,
  weanings: [],
};

const DETAIL: CycleDetail = {
  cycle: CYCLE,
  heats: [HEAT],
  matings: [MATING],
  diagnoses: [DIAGNOSIS],
  abortions: [],
  births: [BIRTH],
  litters: [LITTER],
};

const LOT: Lot = {
  id: 'lot-1',
  farmId: 'farm-1',
  speciesId: 'species-1',
  name: 'Portée 2026 - lot',
  code: null,
  productionType: null,
  status: 'OPEN',
  entryDate: '2026-12-01',
  initialCount: 2,
  currentCount: 2,
  origin: 'LITTER',
  unitCost: null,
  closedAt: null,
  version: 1,
  createdAt: '2026-12-01T10:00:00Z',
  updatedAt: '2026-12-01T10:00:00Z',
};

const HERD_STUB = {
  animals: () => of({ items: [FEMALE], nextCursor: null }),
};

const REPRODUCTION_STUB = {
  cycles: () => of({ items: [CYCLE], nextCursor: null }),
  createCycle: () => of(CYCLE),
  cycle: () => of(DETAIL),
  recordHeat: () => of(HEAT),
  recordMating: () => of(MATING),
  recordDiagnosis: () => of(DIAGNOSIS),
  recordBirth: () =>
    of({
      birth: BIRTH,
      litterId: 'litter-1',
      retroactiveMatingSuggested: false,
      suggestedMatingDate: null,
    }),
  recordWeaning: () => of(WEANING),
  createLotFromLitter: () => of(LOT),
};

function routeWith(id: string | null = null, cycle: string | null = null) {
  return {
    snapshot: {
      paramMap: { get: () => id },
      queryParamMap: { get: () => cycle },
    },
  };
}

async function render<T>(component: Type<T>, id: string | null = null) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: routeWith(id) },
      { provide: HerdService, useValue: HERD_STUB },
      { provide: ReproductionService, useValue: REPRODUCTION_STUB },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('fr');
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('Reproduction web pages', () => {
  it('renders the cycle list', async () => {
    const fixture = await render(ReproductionPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Cycles de reproduction');
    expect(text).toContain('A-001 - Bella');
    expect(text).toContain('Nouveau cycle');
  });

  it('renders the heat form', async () => {
    const fixture = await render(HeatPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Chaleurs');
    expect(text).toContain('Détection des chaleurs');
    expect(text).toContain('A-001 - Bella');
    expect(text).toContain('Enregistrer');
  });

  it('renders the mating form', async () => {
    const fixture = await render(MatingPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Saillie ou insémination');
    expect(text).toContain('Méthode');
    expect(text).toContain('Code semence');
  });

  it('renders the diagnosis form', async () => {
    const fixture = await render(DiagnosisPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Diagnostic de gestation');
    expect(text).toContain('Résultat');
    expect(text).toContain('Enregistrer');
  });

  it('renders the birth form', async () => {
    const fixture = await render(BirthPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Mise bas');
    expect(text).toContain('Nés vivants');
    expect(text).toContain('Mort-nés');
  });

  it('renders the weaning form with litters', async () => {
    const fixture = await render(WeaningPage);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Sevrage');
    expect(text).toContain('Portée 2026');
    expect(text).toContain('Nombre sevré');
  });

  it('renders the cycle detail with events and litters', async () => {
    const fixture = await render(CycleDetailPage, 'cycle-1');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Fiche cycle');
    expect(text).toContain('Diagnostic prévu');
    expect(text).toContain('Chaleurs');
    expect(text).toContain('Portée 2026');
    expect(text).toContain('Créer un lot');
  });
});
