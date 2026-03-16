import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { UIStore } from '../stores/ui.store';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const ui = inject(UIStore);
  ui.startLoading();
  return next(req).pipe(finalize(() => ui.stopLoading()));
};
