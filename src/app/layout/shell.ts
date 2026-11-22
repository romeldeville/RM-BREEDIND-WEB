import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { AppStore } from '../core/state/app-store';
import { ToastContainer } from './toast-container';

interface NavItem {
  labelKey: string;
  route: string;
  path: string;
}

interface NavSection {
  labelKey: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, ToastContainer],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  readonly store = inject(AppStore);

  readonly sections: NavSection[] = [
    {
      labelKey: 'nav.section.pilotage',
      items: [
        {
          labelKey: 'nav.dashboard',
          route: '/app/dashboard',
          path: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
        },
        {
          labelKey: 'nav.reports',
          route: '/app/reports',
          path: 'M4 19h16M7 16V9M12 16V5M17 16v-4',
        },
      ],
    },
    {
      labelKey: 'nav.section.operations',
      items: [
        {
          labelKey: 'nav.herd',
          route: '/app/herd',
          path: 'M4 7h16v10H4zM8 17v3M16 17v3M4 12h16',
        },
        {
          labelKey: 'nav.reproduction',
          route: '/app/reproduction',
          path: 'M12 21s-7-4.35-9.5-8A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 7C19 16.65 12 21 12 21z',
        },
        { labelKey: 'nav.health', route: '/app/health', path: 'M12 3v18M3 12h18' },
        { labelKey: 'nav.feeding', route: '/app/feeding', path: 'M4 4h16v4H4zM6 8v12h12V8' },
        { labelKey: 'nav.production', route: '/app/production', path: 'M12 2v20M5 9l7-7 7 7' },
        {
          labelKey: 'nav.species',
          route: '/app/species',
          path: 'M12 2a4 4 0 0 1 4 4c0 2-1 3-1 5s2 3 2 6a5 5 0 0 1-10 0c0-3 2-4 2-6S8 8 8 6a4 4 0 0 1 4-4z',
        },
        {
          labelKey: 'nav.lots',
          route: '/app/lots',
          path: 'M4 7h16v10H4zM8 17v3M16 17v3M4 12h16',
        },
        {
          labelKey: 'nav.sites',
          route: '/app/sites',
          path: 'M3 21V8l9-5 9 5v13M9 21v-6h6v6',
        },
      ],
    },
    {
      labelKey: 'nav.section.business',
      items: [
        { labelKey: 'nav.sales', route: '/app/sales', path: 'M3 3v18h18M7 15l4-4 3 3 5-6' },
        {
          labelKey: 'nav.finance',
          route: '/app/finance',
          path: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
        },
      ],
    },
    {
      labelKey: 'nav.section.admin',
      items: [
        {
          labelKey: 'nav.alerts',
          route: '/app/alerts',
          path: 'M12 2a7 7 0 0 0-7 7v5l-2 2h18l-2-2V9a7 7 0 0 0-7-7zM9 21h6',
        },
        {
          labelKey: 'nav.settings',
          route: '/app/settings',
          path: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 2h-5l-.3 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.5L4.1 11a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 2.5h5l.3-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5a7 7 0 0 0 .1-1z',
        },
        {
          labelKey: 'nav.subscription',
          route: '/app/settings/subscription',
          path: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z',
        },
      ],
    },
    {
      labelKey: 'nav.section.platform',
      items: [
        {
          labelKey: 'nav.platform',
          route: '/app/platform',
          path: 'M12 2l8 4v6c0 5.55-3.84 10.74-8 12-4.16-1.26-8-6.45-8-12V6l8-4z',
        },
      ],
    },
  ];

  toggleLanguage(): void {
    this.i18n.toggleLocale();
  }

  logout(): void {
    this.auth.logout();
  }
}
