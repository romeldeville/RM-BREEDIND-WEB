import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const base = environment.apiBaseUrl.replace(/\/$/, '');

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('creates a demo session', () => {
    const session = service.loginDemo();
    expect(session.tenant?.slug).toBe('ferme-demo');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.tenantId()).toBe('11111111-1111-1111-1111-111111111111');
    expect(service.initials()).toBe('DÉ');
  });

  it('logs in, loads profile and tenants, then persists the session', () => {
    let completed = false;
    service.login({ email: 'owner@farm.test', password: 'TestPassword123!' }).subscribe((outcome) => {
      expect(outcome.kind).toBe('session');
      if (outcome.kind === 'session') {
        expect(outcome.session.tenant?.id).toBe('tenant-1');
        expect(outcome.session.user.fullName).toBe('Owner One');
      }
      completed = true;
    });

    http.expectOne(`${base}/auth/login`).flush({
      accessToken: token({ tenantId: 'tenant-1' }),
      refreshToken: 'refresh-1',
      expiresIn: 900,
    });

    http.expectOne(`${base}/auth/me`).flush({
      id: 'user-1',
      email: 'owner@farm.test',
      fullName: 'Owner One',
      locale: 'fr',
      platformAdmin: false,
      memberships: [{ tenantId: 'tenant-1', tenantName: 'Farm One', role: 'OWNER', farmScope: [] }],
    });
    http
      .expectOne(`${base}/tenants`)
      .flush([{ id: 'tenant-1', name: 'Farm One', slug: 'farm-one', status: 'ACTIVE', planCode: 'FREE' }]);

    expect(completed).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.tenantId()).toBe('tenant-1');
    expect(service.roles()).toEqual(['OWNER']);
    expect(localStorage.getItem('rmb.session')).toContain('refresh-1');
  });

  it('reports MFA requirement with a challenge id', () => {
    let challenge: string | null = null;
    service.login({ email: 'admin@farm.test', password: 'TestPassword123!' }).subscribe((outcome) => {
      if (outcome.kind === 'mfa') {
        challenge = outcome.challengeId;
      }
    });

    http
      .expectOne(`${base}/auth/login`)
      .flush({ code: 'MFA_REQUIRED', challengeId: 'challenge-1' }, { status: 401, statusText: 'Unauthorized' });

    expect(challenge).toBe('challenge-1');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('rotates the refresh token', () => {
    service.login({ email: 'owner@farm.test', password: 'TestPassword123!' }).subscribe();
    http.expectOne(`${base}/auth/login`).flush({
      accessToken: token({ tenantId: 'tenant-1' }),
      refreshToken: 'refresh-1',
      expiresIn: 900,
    });
    http.expectOne(`${base}/auth/me`).flush({
      id: 'user-1',
      email: 'owner@farm.test',
      fullName: 'Owner One',
      locale: 'fr',
      platformAdmin: false,
      memberships: [{ tenantId: 'tenant-1', tenantName: 'Farm One', role: 'OWNER', farmScope: [] }],
    });
    http
      .expectOne(`${base}/tenants`)
      .flush([{ id: 'tenant-1', name: 'Farm One', slug: 'farm-one', status: 'ACTIVE', planCode: 'FREE' }]);

    let refreshed = false;
    service.refresh().subscribe((value) => (refreshed = value));

    http.expectOne(`${base}/auth/refresh`).flush({
      accessToken: token({ tenantId: 'tenant-1' }),
      refreshToken: 'refresh-2',
      expiresIn: 900,
    });

    expect(refreshed).toBe(true);
    expect(service.session()?.refreshToken).toBe('refresh-2');
  });

  function token(payload: Record<string, unknown>): string {
    const encode = (value: unknown) =>
      btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${encode({ alg: 'HS384' })}.${encode(payload)}.signature`;
  }
});
