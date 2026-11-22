import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ReferentialService, Species } from '../../core/api/referential.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SpeciesListPage } from './species-list.page';

const SPECIES: Species = {
  id: 'species-1',
  name: 'Bovin',
  code: 'bovin',
  productionType: 'MILK',
  trackingMode: 'INDIVIDUAL',
  gestationDays: 283,
  heatCycleDays: 21,
  weaningAgeDays: 90,
  incubationDays: null,
  settings: {},
  archivedAt: null,
  createdAt: '2026-11-12T00:00:00Z',
  updatedAt: '2026-11-12T00:00:00Z',
};

describe('SpeciesListPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeciesListPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ReferentialService,
          useValue: {
            species: () => of([SPECIES]),
            archiveSpecies: () => of(undefined),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders the species list', async () => {
    TestBed.inject(I18nService).setLocale('fr');
    const fixture = TestBed.createComponent(SpeciesListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Bovin');
    expect(text).toContain('bovin');
    expect(text).toContain('Nouvelle espèce');
  });
});
