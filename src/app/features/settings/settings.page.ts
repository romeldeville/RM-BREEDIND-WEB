import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Locale } from '../../core/i18n/translations';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage {
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  // Profile fields
  fullName = signal('');
  phone = signal('');
  locale = signal<Locale>('fr');
  profileSaving = signal(false);
  profileSuccess = signal<string | null>(null);
  profileError = signal<string | null>(null);

  // Password fields
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  passwordSaving = signal(false);
  passwordSuccess = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const u = this.auth.user();
      if (u) {
        this.fullName.set(u.fullName || '');
        this.phone.set(u.phone || '');
        this.locale.set((u.locale as Locale) || this.i18n.locale());
      }
    });
  }

  setLocale(locale: Locale): void {
    this.locale.set(locale);
    this.i18n.setLocale(locale);
  }

  saveProfile(): void {
    const name = this.fullName().trim();
    if (!name) {
      this.profileError.set('Le nom complet est obligatoire.');
      return;
    }
    this.profileSaving.set(true);
    this.profileSuccess.set(null);
    this.profileError.set(null);

    this.auth.updateProfile({
      fullName: name,
      phone: this.phone().trim() || undefined,
      locale: this.locale(),
    }).subscribe({
      next: (updated) => {
        this.profileSaving.set(false);
        this.profileSuccess.set('Vos informations de profil ont été mises à jour avec succès.');
        if (updated.locale === 'fr' || updated.locale === 'en') {
          this.i18n.setLocale(updated.locale);
        }
      },
      error: (err) => {
        this.profileSaving.set(false);
        this.profileError.set(err?.error?.detail || err?.message || 'Erreur lors de la mise à jour du profil.');
      },
    });
  }

  changePassword(): void {
    this.passwordSuccess.set(null);
    this.passwordError.set(null);

    if (!this.currentPassword()) {
      this.passwordError.set('Veuillez renseigner votre mot de passe actuel.');
      return;
    }
    if (this.newPassword().length < 12) {
      this.passwordError.set('Le nouveau mot de passe doit contenir au moins 12 caractères.');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('Les deux mots de passe ne correspondent pas.');
      return;
    }

    this.passwordSaving.set(true);
    this.auth.changePassword({
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword(),
    }).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.passwordSuccess.set('Votre mot de passe a été modifié avec succès.');
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
      },
      error: (err) => {
        this.passwordSaving.set(false);
        this.passwordError.set(
          err?.status === 400 || err?.status === 401
            ? 'Le mot de passe actuel est incorrect.'
            : (err?.error?.detail || 'Erreur lors du changement de mot de passe.')
        );
      },
    });
  }
}
