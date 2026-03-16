import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, delay, of, tap } from 'rxjs';

import { CourseListItem } from '../services/courses';
import { UIStore } from './ui.store';

@Injectable({
  providedIn: 'root',
})
export class CoursesStore {
  private readonly http = inject(HttpClient);
  private readonly ui = inject(UIStore);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly courses = signal<CourseListItem[]>([]);
  readonly coursesList = this.courses.asReadonly();

  private readonly lastError = signal<string | null>(null);
  readonly error = this.lastError.asReadonly();

  readonly total = computed(() => this.courses().length);

  loadCourses(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.lastError.set(null);

    this.http
      .get<CourseListItem[]>('/mock/courses.json')
      .pipe(
        delay(300),
        tap((items) => this.courses.set(items ?? [])),
        catchError((err) => {
          this.lastError.set('Не удалось загрузить курсы');
          this.ui.error('Не удалось загрузить курсы');
          return of([] as CourseListItem[]);
        }),
      )
      .subscribe();
  }
}
