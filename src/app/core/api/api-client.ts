import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { I18nService } from '../i18n/i18n.service';
import { NotificationService } from '../notifications/notification.service';
import { CursorQuery, PageResponse } from './page-response';
import { ProblemDetails, isProblemDetails, problemMessage } from './problem-details';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly notifications = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  get<T>(path: string, query?: CursorQuery | Record<string, unknown>): Observable<T> {
    return this.http
      .get<T>(this.url(path), { params: this.toParams(query) })
      .pipe(catchError((error) => this.handle(error)));
  }

  getPage<T>(path: string, query?: CursorQuery): Observable<PageResponse<T>> {
    return this.get<PageResponse<T>>(path, query);
  }

  post<T>(path: string, body: unknown, idempotencyKey?: string): Observable<T> {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
    return this.http
      .post<T>(this.url(path), body, { headers })
      .pipe(catchError((error) => this.handle(error)));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<T>(this.url(path), body)
      .pipe(catchError((error) => this.handle(error)));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path)).pipe(catchError((error) => this.handle(error)));
  }

  newIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private url(path: string): string {
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    return `${base}/${path.replace(/^\//, '')}`;
  }

  private toParams(query?: CursorQuery | Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    if (!query) {
      return params;
    }
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      params = params.set(key, String(value));
    }
    return params;
  }

  private handle(error: HttpErrorResponse): Observable<never> {
    const payload = error.error;
    const problem: ProblemDetails | null = isProblemDetails(payload) ? payload : null;
    const message = problemMessage(problem, this.i18n.t('common.error'));
    this.notifications.error(message);
    return throwError(() => error);
  }
}
