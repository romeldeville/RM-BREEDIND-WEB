import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-select-tenant-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="login">
      <main class="login__panel">
        <section class="card login__form">
          <header>
            <h2>{{ 'tenant.select.title' | t }}</h2>
            <p>{{ 'tenant.select.subtitle' | t }}</p>
          </header>

          @if (error()) {
            <div class="form-error" role="alert">{{ error() }}</div>
          }

          <ul class="tenant-list">
            @for (membership of auth.user()?.memberships ?? []; track membership.tenantId) {
              <li class="tenant-list__item">
                <div>
                  <strong>{{ membership.tenantName }}</strong>
                  <small>{{ membership.role }}</small>
                </div>
                @if (membership.tenantId === auth.tenantId()) {
                  <span class="chip">{{ 'tenant.select.current' | t }}</span>
                } @else {
                  <button
                    type="button"
                    class="btn btn--primary"
                    [disabled]="switching()"
                    (click)="select(membership.tenantId)"
                  >
                    {{ 'tenant.select.switch' | t }}
                  </button>
                }
              </li>
            }
          </ul>

          <button type="button" class="btn btn--ghost" (click)="continue()">
            {{ 'tenant.select.continue' | t }}
          </button>
        </section>
      </main>
    </div>
  `,
  styleUrl: '../login/login.page.scss',
})
export class SelectTenantPage {
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  readonly switching = signal(false);
  readonly error = signal<string | null>(null);

  select(tenantId: string): void {
    if (this.switching()) {
      return;
    }
    this.switching.set(true);
    this.error.set(null);
    this.auth.switchTenant(tenantId).subscribe({
      next: () => {
        this.switching.set(false);
        void this.router.navigate(['/app/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.switching.set(false);
        this.error.set(
          typeof error.error?.detail === 'string' ? error.error.detail : this.i18n.t('common.error'),
        );
      },
    });
  }

  continue(): void {
    void this.router.navigate(['/app/dashboard']);
  }
}
