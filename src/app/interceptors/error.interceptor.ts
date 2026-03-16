import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { UIStore } from '../stores/ui.store';

export const errorInterceptor: HttpInterceptorFn = (_req, next) => {
  const ui = inject(UIStore);

  return next(_req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        ui.error(err.error?.message ?? err.message ?? 'Ошибка запроса');
      } else {
        ui.error('Неизвестная ошибка');
      }

      return throwError(() => err);
    }),
  );
};
