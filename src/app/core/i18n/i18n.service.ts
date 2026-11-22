import { Injectable, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Locale, TRANSLATIONS } from './translations';

const STORAGE_KEY = 'rmb.locale';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly localeSignal = signal<Locale>(this.readInitialLocale());

  readonly locale = this.localeSignal.asReadonly();
  readonly availableLocales: Locale[] = ['fr', 'en'];

  readonly dir = computed(() => (this.localeSignal() === 'fr' ? 'ltr' : 'ltr'));

  setLocale(locale: Locale): void {
    this.localeSignal.set(locale);
    this.document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* storage unavailable (SSR/private mode) */
    }
  }

  toggleLocale(): void {
    this.setLocale(this.localeSignal() === 'fr' ? 'en' : 'fr');
  }

  t(key: string, params?: Record<string, string | number>): string {
    const dict = TRANSLATIONS[this.localeSignal()];
    let value = dict[key] ?? TRANSLATIONS.fr[key] ?? key;
    if (params) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replaceAll(`{${name}}`, String(replacement));
      }
    }
    return value;
  }

  private readInitialLocale(): Locale {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'fr' || stored === 'en') {
        return stored;
      }
    } catch {
      /* ignore */
    }
    const browser = typeof navigator !== 'undefined' ? navigator.language : 'fr';
    return browser.toLowerCase().startsWith('en') ? 'en' : 'fr';
  }
}
