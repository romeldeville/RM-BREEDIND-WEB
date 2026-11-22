import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

let requestCounter = 0;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.accessToken();
  const tenantId = auth.tenantId();
  const requestId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `req-${Date.now()}-${++requestCounter}`;

  const headers: Record<string, string> = {
    'X-Request-Id': requestId,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  const authorized = request.clone({ setHeaders: headers });

  return next(authorized).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.isAuthenticated()) {
        return auth.refresh().pipe(
          switchMap((refreshed) => {
            if (!refreshed) {
              void router.navigate(['/login']);
              return throwError(() => error);
            }
            const retried = request.clone({
              setHeaders: {
                ...headers,
                Authorization: `Bearer ${auth.accessToken() ?? ''}`,
              },
            });
            return next(retried);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
