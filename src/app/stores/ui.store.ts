import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type ToastKind = 'success' | 'error' | 'info';

@Injectable({
  providedIn: 'root',
})
export class UIStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly snackBar = inject(MatSnackBar);

  private readonly activeRequests = signal(0);
  readonly isLoading = computed(() => this.activeRequests() > 0);

  startLoading(): void {
    this.activeRequests.set(this.activeRequests() + 1);
  }

  stopLoading(): void {
    this.activeRequests.set(Math.max(0, this.activeRequests() - 1));
  }

  toast(message: string, kind: ToastKind = 'info'): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const panelClass = kind === 'success' ? ['toast-success'] : kind === 'error' ? ['toast-error'] : ['toast-info'];

    this.snackBar.open(message, 'OK', {
      duration: 3000,
      panelClass,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  success(message: string): void {
    this.toast(message, 'success');
  }

  error(message: string): void {
    this.toast(message, 'error');
  }
}
