import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error && error.error.message) {
        if (Array.isArray(error.error.message)) {
          errorMessage = error.error.message.join(', ');
        } else {
          errorMessage = error.error.message;
        }
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to Amrit Dairy server. Please ensure backend is running.';
      } else if (error.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied. You do not have permission for this action.';
      }

      // Do not popup toast for background polling 401s when user is a guest (not logged in)
      if (error.status === 401 && !localStorage.getItem('amrit_dairy_token')) {
        return throwError(() => error);
      }

      // Do not popup toast for auth/me background checks or guest cart polling
      if (!req.url.includes('/auth/me') && !req.url.includes('/cart')) {
        toast.error(errorMessage);
      }

      return throwError(() => error);
    }),
  );
};
