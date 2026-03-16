import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, shareReplay, switchMap, tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

import { AuthService } from '../../services/auth';
import { CourseDetail, CourseLesson, CoursesService, LessonAccessStatus } from '../../services/courses';

@Component({
  selector: 'app-course-detail',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './course-detail.html',
  styleUrls: ['./course-detail.scss'],
})
export class CourseDetailComponent {
  private readonly coursesService = inject(CoursesService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly loading = signal(true);
  protected readonly courseId = signal<string>('');
  protected readonly taskDoneOverrides = signal<Record<string, boolean>>({});

  protected readonly course$ = this.route.paramMap.pipe(
    map((p) => p.get('id') ?? ''),
    tap((id) => {
      this.courseId.set(id);
      this.loading.set(true);
    }),
    switchMap((id) => this.coursesService.getCourseDetail(id)),
    tap(() => this.loading.set(false)),
    shareReplay({ bufferSize: 1, refCount: true }),
    takeUntilDestroyed(this.destroyRef),
  );

  protected readonly enrolled = computed(() => {
    const id = this.courseId();
    return id ? this.authService.isEnrolled(id) : false;
  });

  protected enroll(): void {
    const id = this.courseId();
    if (!id) {
      return;
    }

    this.authService.enroll(id);
  }

  protected continueLearning(): void {
    // Placeholder: later navigate to the first lesson page
    void this.router.navigate(['/courses', this.courseId()]);
  }

  protected displayLessonStatus(lesson: CourseLesson): LessonAccessStatus {
    if (this.enrolled()) {
      if (this.isTaskDone(lesson.id)) {
        return 'completed';
      }
      return 'available';
    }
    return lesson.status;
  }

  protected isTaskDone(lessonId: string): boolean {
    const overrides = this.taskDoneOverrides();
    return overrides[lessonId] ?? false;
  }

  protected toggleTaskDone(lessonId: string): void {
    if (!this.enrolled()) {
      return;
    }

    const next = { ...this.taskDoneOverrides() };
    next[lessonId] = !next[lessonId];
    this.taskDoneOverrides.set(next);
  }

  protected formatDuration(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h <= 0) {
      return `${m} мин`;
    }
    return `${h} ч ${m} мин`;
  }

  protected starIcon(index: number, rating: number): 'star' | 'star_half' | 'star_outline' {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;

    if (index <= fullStars) {
      return 'star';
    }

    if (index === fullStars + 1 && hasHalf) {
      return 'star_half';
    }

    return 'star_outline';
  }

  protected lessonStatusIcon(status: LessonAccessStatus): string {
    switch (status) {
      case 'completed':
        return 'check_circle';
      case 'available':
        return 'play_circle';
      case 'locked':
        return 'lock';
    }
  }

  protected lessonStatusLabel(status: LessonAccessStatus): string {
    switch (status) {
      case 'completed':
        return 'Пройдено';
      case 'available':
        return 'Доступно';
      case 'locked':
        return 'Заблокировано';
    }
  }
}
