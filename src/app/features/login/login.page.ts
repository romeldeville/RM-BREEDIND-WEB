import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly i18n = inject(I18nService);
  readonly demoMode = environment.demoMode;
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (outcome) => {
        this.submitting.set(false);
        if (outcome.kind === 'mfa') {
          void this.router.navigate(['/login/otp'], {
            queryParams: { challenge: outcome.challengeId },
          });
          return;
        }
        this.redirect();
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.set(this.messageFor(error));
      },
    });
  }

  enterDemo(): void {
    this.auth.loginDemo();
    this.redirect();
  }

  toggleLanguage(): void {
    this.i18n.toggleLocale();
  }

  private messageFor(error: HttpErrorResponse): string {
    if (error.status === 423) {
      return this.i18n.t('auth.login.locked');
    }
    if (error.status === 401) {
      return this.i18n.t('auth.login.error');
    }
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }

  private redirect(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/app/dashboard';
    void this.router.navigateByUrl(returnUrl);
  }
}
