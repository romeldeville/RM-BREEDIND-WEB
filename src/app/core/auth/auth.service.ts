import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthSession,
  ChangePasswordRequest,
  LoginOutcome,
  LoginRequest,
  Me,
  Role,
  Tenant,
  TokenPair,
  UpdateProfileRequest,
} from './auth.models';

const STORAGE_KEY = 'rmb.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessionSignal = signal<AuthSession | null>(this.readSession());

  readonly session = this.sessionSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionSignal() !== null);
  readonly user = computed(() => this.sessionSignal()?.user ?? null);
  readonly tenant = computed(() => this.sessionSignal()?.tenant ?? null);
  readonly displayName = computed(() => this.user()?.fullName ?? '');
  readonly initials = computed(() => {
    const name = this.displayName().trim();
    if (!name) {
      return '?';
    }
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });
  readonly isPlatformAdmin = computed(() => this.user()?.platformAdmin ?? false);
  readonly roles = computed<Role[]>(() => {
    const session = this.sessionSignal();
    if (!session) {
      return [];
    }
    if (session.user.platformAdmin) {
      return ['PLATFORM_ADMIN'];
    }
    const membership = session.user.memberships.find(
      (item) => item.tenantId === session.tenant?.id,
    );
    return membership ? [membership.role] : [];
  });

  login(request: LoginRequest): Observable<LoginOutcome> {
    return this.http.post<TokenPair>(this.url('/auth/login'), request).pipe(
      switchMap((tokens) =>
        this.complete(tokens).pipe(map<AuthSession, LoginOutcome>((session) => ({ kind: 'session', session }))),
      ),
      catchError((error: HttpErrorResponse) => {
        const body = error.error;
        if (error.status === 401 && body?.code === 'MFA_REQUIRED' && body?.challengeId) {
          return of<LoginOutcome>({ kind: 'mfa', challengeId: body.challengeId });
        }
        return throwError(() => error);
      }),
    );
  }

  verifyMfa(challengeId: string, code: string): Observable<AuthSession> {
    return this.http
      .post<TokenPair>(this.url('/auth/mfa/verify'), { challengeId, code })
      .pipe(switchMap((tokens) => this.complete(tokens)));
  }

  requestOtp(destination: string, channel: 'EMAIL' | 'SMS' = 'EMAIL'): Observable<void> {
    return this.http.post<void>(this.url('/auth/otp/request'), { destination, channel });
  }

  verifyOtp(destination: string, code: string): Observable<AuthSession> {
    return this.http
      .post<TokenPair>(this.url('/auth/otp/verify'), { destination, code })
      .pipe(switchMap((tokens) => this.complete(tokens)));
  }

  switchTenant(tenantId: string): Observable<AuthSession> {
    return this.http
      .post<TokenPair>(this.url(`/tenants/${tenantId}/switch`), {})
      .pipe(switchMap((tokens) => this.complete(tokens)));
  }

  updateProfile(request: UpdateProfileRequest): Observable<Me> {
    const session = this.sessionSignal();
    if (!session) {
      return throwError(() => new Error('Not authenticated'));
    }
    if (session.accessToken === 'demo-token') {
      const updatedUser: Me = {
        ...session.user,
        fullName: request.fullName,
        phone: request.phone ?? session.user.phone,
        locale: request.locale ?? session.user.locale,
      };
      this.persist({ ...session, user: updatedUser });
      return of(updatedUser);
    }
    const headers = this.bearer(session.accessToken);
    return this.http.put<Me>(this.url('/auth/me'), request, { headers }).pipe(
      tap((updatedMe) => {
        this.persist({ ...session, user: updatedMe });
      }),
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    const session = this.sessionSignal();
    if (!session) {
      return throwError(() => new Error('Not authenticated'));
    }
    if (session.accessToken === 'demo-token') {
      return of(void 0);
    }
    const headers = this.bearer(session.accessToken);
    return this.http.post<void>(this.url('/auth/password/change'), request, { headers });
  }

  loginDemo(): AuthSession {
    const session: AuthSession = {
      accessToken: 'demo-token',
      refreshToken: 'demo-refresh',
      expiresAt: Date.now() + 15 * 60 * 1000,
      user: {
        id: 'demo-user',
        email: 'demo@rmbreeding.local',
        fullName: 'Demo Éleveur',
        locale: 'fr',
        platformAdmin: false,
        memberships: [
          {
            tenantId: '11111111-1111-1111-1111-111111111111',
            tenantName: 'Ferme Démo',
            role: 'OWNER',
            farmScope: [],
          },
        ],
      },
      tenant: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Ferme Démo',
        slug: 'ferme-demo',
        status: 'ACTIVE',
        planCode: 'PRO',
      },
    };
    this.persist(session);
    return session;
  }

  logout(): void {
    const session = this.sessionSignal();
    if (session && session.accessToken !== 'demo-token') {
      this.http
        .post<void>(this.url('/auth/logout'), {}, { headers: this.bearer(session.accessToken) })
        .subscribe({ next: () => undefined, error: () => undefined });
    }
    this.clear();
    void this.router.navigate(['/login']);
  }

  accessToken(): string | null {
    return this.sessionSignal()?.accessToken ?? null;
  }

  tenantId(): string | null {
    return this.sessionSignal()?.tenant?.id ?? null;
  }

  refresh(): Observable<boolean> {
    const current = this.sessionSignal();
    if (!current || current.accessToken === 'demo-token') {
      return of(false);
    }
    return this.http
      .post<TokenPair>(this.url('/auth/refresh'), { refreshToken: current.refreshToken })
      .pipe(
        tap((tokens) =>
          this.persist({
            ...current,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: Date.now() + tokens.expiresIn * 1000,
          }),
        ),
        map(() => true),
        catchError(() => {
          this.clear();
          return of(false);
        }),
      );
  }

  private complete(tokens: TokenPair): Observable<AuthSession> {
    const headers = this.bearer(tokens.accessToken);
    return forkJoin({
      me: this.http.get<Me>(this.url('/auth/me'), { headers }),
      tenants: this.http.get<Tenant[]>(this.url('/tenants'), { headers }),
    }).pipe(
      map(({ me, tenants }) => {
        const currentTenantId = this.tenantIdFromToken(tokens.accessToken);
        const tenant =
          tenants.find((item) => item.id === currentTenantId) ??
          tenants.find((item) => item.id === me.memberships[0]?.tenantId) ??
          tenants[0] ??
          null;
        const session: AuthSession = {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + tokens.expiresIn * 1000,
          user: me,
          tenant,
        };
        this.persist(session);
        return session;
      }),
    );
  }

  private persist(session: AuthSession): void {
    this.sessionSignal.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
  }

  private clear(): void {
    this.sessionSignal.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  private readSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }

  private bearer(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private url(path: string): string {
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    return `${base}/${path.replace(/^\//, '')}`;
  }

  private tenantIdFromToken(token: string): string | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const decoded = JSON.parse(atob(padded));
      return typeof decoded.tenantId === 'string' ? decoded.tenantId : null;
    } catch {
      return null;
    }
  }
}
