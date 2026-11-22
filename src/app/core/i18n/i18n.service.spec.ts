import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  it('translates a known key', () => {
    service.setLocale('fr');
    expect(service.t('nav.dashboard')).toBe('Tableau de bord');
  });

  it('switches locale', () => {
    service.setLocale('fr');
    service.toggleLocale();
    expect(service.locale()).toBe('en');
    expect(service.t('nav.dashboard')).toBe('Dashboard');
  });

  it('falls back to the key when missing', () => {
    expect(service.t('unknown.key')).toBe('unknown.key');
  });
});
