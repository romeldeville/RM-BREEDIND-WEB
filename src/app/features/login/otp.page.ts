import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-otp-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  template: `
    <div class="login">
      <main class="login__panel">
        <form class="card login__form" [formGroup]="form" (ngSubmit)="submit()">
          <header>
            <h2>{{ (mfaChallenge() ? 'auth.otp.mfaTitle' : 'auth.otp.title') | t }}</h2>
            <p>{{ 'auth.otp.subtitle' | t }}</p>
          </header>

          @if (error()) {
            <div class="form-error" role="alert">{{ error() }}</div>
          }
          @if (info()) {
            <div class="form-success" role="status">{{ info() }}</div>
          }

          @if (!mfaChallenge()) {
            <label class="field">
              <span>{{ 'auth.otp.destination' | t }}</span>
              <input type="text" formControlName="destination" autocomplete="username" />
            </label>
            <button type="button" class="btn btn--ghost" [disabled]="sending()" (click)="requestCode()">
              {{ sending() ? ('common.loading' | t) : ('auth.otp.send' | t) }}
            </button>
          }

          <label class="field">
            <span>{{ 'auth.otp.code' | t }}</span>
            <input
              type="text"
              inputmode="numeric"
              maxlength="6"
              formControlName="code"
              autocomplete="one-time-code"
            />
          </label>

          <button type="submit" class="btn btn--primary" [disabled]="submitting()">
            {{ submitting() ? ('common.loading' | t) : ('auth.otp.verify' | t) }}
          </button>

          <a class="login__link" routerLink="/login">{{ 'auth.otp.back' | t }}</a>
        </form>
      </main>
    </div>
  `,
  styleUrl: '../login/login.page.scss',
})
export class OtpPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(I18nService);

  readonly mfaChallenge = signal<string | null>(
    this.route.snapshot.queryParamMap.get('challenge'),
  );
  readonly submitting = signal(false);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    destination: [''],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  requestCode(): void {
    const destination = this.form.controls.destination.value.trim();
    if (!destination || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    this.auth.requestOtp(destination).subscribe({
      next: () => {
        this.sending.set(false);
        this.info.set(this.i18n.t('auth.otp.sent'));
      },
      error: (error: HttpErrorResponse) => {
        this.sending.set(false);
        this.error.set(this.messageFor(error));
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const { destination, code } = this.form.getRawValue();
    const challenge = this.mfaChallenge();
    const request = challenge
      ? this.auth.verifyMfa(challenge, code)
      : this.auth.verifyOtp(destination.trim(), code);

    request.subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigate(['/app/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.set(this.messageFor(error));
      },
    });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
