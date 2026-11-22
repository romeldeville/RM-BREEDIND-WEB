import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiClient } from '../../core/api/api-client';
import { AuthService } from '../../core/auth/auth.service';
import { Invitation, Member, Role } from '../../core/auth/auth.models';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

const ROLES: Role[] = ['OWNER', 'MANAGER', 'WORKER', 'VET', 'ACCOUNTANT'];

@Component({
  selector: 'app-members-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, DatePipe],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <h1>{{ 'members.title' | t }}</h1>
          <p>{{ 'members.subtitle' | t }}</p>
        </div>
        <button type="button" class="btn btn--ghost" (click)="reload()">
          {{ 'common.retry' | t }}
        </button>
      </header>

      @if (error()) {
        <div class="form-error" role="alert">{{ error() }}</div>
      }

      <div class="card">
        <h2>{{ 'members.invite.title' | t }}</h2>
        <form class="members-form" [formGroup]="inviteForm" (ngSubmit)="invite()">
          <label class="field">
            <span>{{ 'members.invite.email' | t }}</span>
            <input type="email" formControlName="email" autocomplete="email" />
          </label>
          <label class="field">
            <span>{{ 'members.invite.role' | t }}</span>
            <select formControlName="role">
              @for (role of roles; track role) {
                <option [value]="role">{{ role }}</option>
              }
            </select>
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="inviting()">
            {{ inviting() ? ('common.loading' | t) : ('members.invite.submit' | t) }}
          </button>
        </form>
      </div>

      <div class="card">
        <h2>{{ 'members.list.title' | t }}</h2>
        @if (loading()) {
          <p>{{ 'common.loading' | t }}</p>
        } @else if (members().length === 0) {
          <p>{{ 'common.empty' | t }}</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>{{ 'members.column.name' | t }}</th>
                <th>{{ 'members.column.email' | t }}</th>
                <th>{{ 'members.column.role' | t }}</th>
                <th>{{ 'members.column.status' | t }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (member of members(); track member.id) {
                <tr>
                  <td>{{ member.fullName }}</td>
                  <td>{{ member.email }}</td>
                  <td>
                    <select [value]="member.role" (change)="changeRole(member, $event)">
                      @for (role of roles; track role) {
                        <option [value]="role">{{ role }}</option>
                      }
                    </select>
                  </td>
                  <td>{{ member.status }}</td>
                  <td>
                    <button type="button" class="btn btn--ghost" (click)="remove(member)">
                      {{ 'members.remove' | t }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <div class="card">
        <h2>{{ 'members.invitations.title' | t }}</h2>
        @if (invitations().length === 0) {
          <p>{{ 'common.empty' | t }}</p>
        } @else {
          <ul class="tenant-list">
            @for (invitation of invitations(); track invitation.id) {
              <li class="tenant-list__item">
                <div>
                  <strong>{{ invitation.email }}</strong>
                  <small>{{ invitation.role }} — {{ invitation.status }}</small>
                </div>
                <span class="chip">{{ invitation.expiresAt | date: 'short' }}</span>
              </li>
            }
          </ul>
        }
      </div>
    </section>
  `,
})
export class MembersPage {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly roles = ROLES;
  readonly members = signal<Member[]>([]);
  readonly invitations = signal<Invitation[]>([]);
  readonly loading = signal(false);
  readonly inviting = signal(false);
  readonly error = signal<string | null>(null);

  readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['WORKER' as Role, [Validators.required]],
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    const tenantId = this.auth.tenantId();
    if (!tenantId) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.get<Member[]>(`/tenants/${tenantId}/members`).subscribe({
      next: (members) => {
        this.members.set(members);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.messageFor(error));
      },
    });
    this.api.get<Invitation[]>(`/tenants/${tenantId}/invitations`).subscribe({
      next: (invitations) => this.invitations.set(invitations),
      error: () => this.invitations.set([]),
    });
  }

  invite(): void {
    const tenantId = this.auth.tenantId();
    if (!tenantId || this.inviteForm.invalid || this.inviting()) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    this.inviting.set(true);
    this.error.set(null);
    this.api
      .post<Invitation>(`/tenants/${tenantId}/invitations`, this.inviteForm.getRawValue())
      .subscribe({
        next: () => {
          this.inviting.set(false);
          this.inviteForm.reset({ email: '', role: 'WORKER' });
          this.reload();
        },
        error: (error: HttpErrorResponse) => {
          this.inviting.set(false);
          this.error.set(this.messageFor(error));
        },
      });
  }

  changeRole(member: Member, event: Event): void {
    const tenantId = this.auth.tenantId();
    const role = (event.target as HTMLSelectElement).value as Role;
    if (!tenantId || role === member.role) {
      return;
    }
    this.api.patch<Member>(`/tenants/${tenantId}/members/${member.id}`, { role }).subscribe({
      next: (updated) =>
        this.members.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        ),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  remove(member: Member): void {
    const tenantId = this.auth.tenantId();
    if (!tenantId) {
      return;
    }
    this.api.delete<void>(`/tenants/${tenantId}/members/${member.id}`).subscribe({
      next: () => this.members.update((items) => items.filter((item) => item.id !== member.id)),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
