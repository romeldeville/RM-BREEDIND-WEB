import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-accept-invitation-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  template: `
    <div class="login">
      <main class="login__panel">
        <form class="card login__form" [formGroup]="form" (ngSubmit)="submit()">
          <header>
            <h2>{{ 'invitation.title' | t }}</h2>
            <p>{{ 'invitation.subtitle' | t }}</p>
          </header>

          @if (!token()) {
            <div class="form-error" role="alert">{{ 'invitation.missingToken' | t }}</div>
          }
          @if (error()) {
            <div class="form-error" role="alert">{{ error() }}</div>
          }

          <label class="field">
            <span>{{ 'invitation.fullName' | t }}</span>
            <input type="text" formControlName="fullName" autocomplete="name" />
          </label>
          <label class="field">
            <span>{{ 'invitation.password' | t }}</span>
            <input type="password" formControlName="password" autocomplete="new-password" />
          </label>

          <button type="submit" class="btn btn--primary" [disabled]="submitting() || !token()">
            {{ submitting() ? ('common.loading' | t) : ('invitation.submit' | t) }}
          </button>

          <a class="login__link" routerLink="/login">{{ 'invitation.back' | t }}</a>
        </form>
      </main>
    </div>
  `,
  styleUrl: '../login/login.page.scss',
})
export class AcceptInvitationPage {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly token = signal(this.route.snapshot.queryParamMap.get('token') ?? '');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(12)]],
  });

  submit(): void {
    if (this.form.invalid || this.submitting() || !this.token()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    this.http
      .post<void>(`${base}/invitations/accept`, {
        token: this.token(),
        ...this.form.getRawValue(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          void this.router.navigate(['/login'], { queryParams: { invited: '1' } });
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          this.error.set(
            typeof error.error?.detail === 'string'
              ? error.error.detail
              : this.i18n.t('common.error'),
          );
        },
      });
  }
}
