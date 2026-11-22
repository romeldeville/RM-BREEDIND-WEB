import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Type } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  Breed,
  FeedingPlan,
  ReferentialService,
  VaccinationPlan,
} from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { BreedsPage } from './breeds.page';
import { SpeciesFormPage } from './species-form.page';
import { SpeciesPlansPage } from './species-plans.page';

const BREED: Breed = {
  id: 'breed-1',
  speciesId: 'species-1',
  name: 'Holstein',
  code: 'holstein',
  archivedAt: null,
};

const VACCINATION: VaccinationPlan = {
  id: 'vac-1',
  speciesId: 'species-1',
  name: 'Rage',
  productId: null,
  ageDays: 90,
  boosterDays: null,
  schedule: [],
  active: true,
};

const FEEDING: FeedingPlan = {
  id: 'feed-1',
  speciesId: 'species-1',
  name: 'Croissance',
  stages: [{ name: 'Démarrage' }, { name: 'Finition' }],
  active: true,
};

function routeWith(id: string | null) {
  return { snapshot: { paramMap: { get: () => id } } };
}

const SERVICE_STUB = {
  speciesById: () => of(null),
  templates: () => of([]),
  breeds: () => of([BREED]),
  vaccinationPlans: () => of([VACCINATION]),
  feedingPlans: () => of([FEEDING]),
};

async function render<T>(component: Type<T>, id: string | null) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: routeWith(id) },
      { provide: ReferentialService, useValue: SERVICE_STUB },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('fr');
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('Species web pages', () => {
  it('renders the species creation form', async () => {
    const fixture = await render(SpeciesFormPage, null);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouvelle espèce');
    expect(text).toContain('Enregistrer');
  });

  it('renders the breeds page', async () => {
    const fixture = await render(BreedsPage, 'species-1');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Races');
    expect(text).toContain('Holstein');
    expect(text).toContain('Ajouter la race');
  });

  it('renders the vaccination and feeding plans page', async () => {
    const fixture = await render(SpeciesPlansPage, 'species-1');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Plans sanitaires et alimentaires');
    expect(text).toContain('Rage');
    expect(text).toContain('Croissance');
    expect(text).toContain('2 étape(s)');
  });
});
