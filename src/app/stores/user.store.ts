import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { AuthService } from '../services/auth';
import { CoursesService, CourseListItem } from '../services/courses';
import { UserProfile, UserService } from '../services/user';

@Injectable({
  providedIn: 'root',
})
export class UserStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly coursesService = inject(CoursesService);

  private readonly profile = signal<UserProfile>(this.userService.getProfile());
  readonly userProfile = this.profile.asReadonly();

  private readonly favorites = signal<Set<string>>(new Set());
  readonly favoriteIds = computed(() => Array.from(this.favorites()));

  constructor() {
    this.restoreFavorites();
  }

  toggleFavorite(courseId: string): void {
    const next = new Set(this.favorites());
    if (next.has(courseId)) {
      next.delete(courseId);
    } else {
      next.add(courseId);
    }
    this.favorites.set(next);
    this.persistFavorites();
  }

  isFavorite(courseId: string): boolean {
    return this.favorites().has(courseId);
  }

  enrolledCourses(): CourseListItem[] {
    return this.coursesService.getCoursesByIds(this.auth.getEnrolledCourseIds());
  }

  getCourseProgressPercent(courseId: string): number {
    if (!isPlatformBrowser(this.platformId)) {
      return 0;
    }

    const lessonIds = [1, 2, 3, 4, 5, 6].map((n) => `${courseId}-lesson-${n}`);
    const completed = lessonIds.filter((id) => window.localStorage.getItem(`lesson:${id}:progress`) === '100').length;
    return Math.round((completed / lessonIds.length) * 100);
  }

  private persistFavorites(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.localStorage.setItem('user:favorites', JSON.stringify(Array.from(this.favorites())));
  }

  private restoreFavorites(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const raw = window.localStorage.getItem('user:favorites');
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        this.favorites.set(new Set(parsed));
      }
    } catch {
      this.favorites.set(new Set());
    }
  }
}
