import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

import { AuthService } from '../../services/auth';
import { CoursesService, CourseListItem } from '../../services/courses';
import { UserProfile, UserService } from '../../services/user';

type CertificateRecord = {
  courseId: string;
  courseTitle: string;
  scorePercent: number;
  passingScorePercent: number;
  attempt: number;
  obtainedAt: number;
};

type CourseProgressVm = {
  course: CourseListItem;
  progressPercent: number;
  lastCompletedLessonTitle: string;
  completed: boolean;
};

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    RouterLink,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly coursesService = inject(CoursesService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly profile = signal<UserProfile>(this.userService.getProfile());

  protected readonly enrolledCourses = computed(() => {
    const ids = this.authService.getEnrolledCourseIds();
    return this.coursesService.getCoursesByIds(ids);
  });

  protected readonly coursesProgress = computed<CourseProgressVm[]>(() => {
    const courses = this.enrolledCourses();
    return courses.map((course) => this.computeProgress(course));
  });

  protected readonly inProgressCourses = computed(() =>
    this.coursesProgress().filter((c) => !c.completed),
  );
  protected readonly completedCourses = computed(() =>
    this.coursesProgress().filter((c) => c.completed),
  );

  protected readonly certificates = signal<CertificateRecord[]>(this.loadCertificates());

  protected reloadCertificates(): void {
    this.certificates.set(this.loadCertificates());
  }

  protected downloadCertificate(cert: CertificateRecord): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 64px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText('Certificate of Completion', 120, 170);

    ctx.font = '400 34px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fillText('This certificate is proudly presented to', 120, 245);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 56px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(this.profile().name, 120, 320);

    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = '400 34px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText('for successfully passing the final test of the course', 120, 390);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 44px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(cert.courseTitle, 120, 455);

    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = '400 30px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(`Score: ${cert.scorePercent}%`, 120, 530);
    ctx.fillText(`Passing score: ${cert.passingScorePercent}%`, 120, 575);
    ctx.fillText(`Attempt: ${cert.attempt}`, 120, 620);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '400 24px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(new Date(cert.obtainedAt).toLocaleString(), 120, 790);

    const a = document.createElement('a');
    a.download = `certificate-${cert.courseId}-${cert.scorePercent}pct.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  protected continueCourse(courseId: string): void {
    // For now, continue opens course detail (later can navigate to last lesson)
  }

  private computeProgress(course: CourseListItem): CourseProgressVm {
    // CoursesService currently generates 6 lessons per course with ids: `${courseId}-lesson-<n>`
    const lessons = [1, 2, 3, 4, 5, 6].map((n) => ({
      id: `${course.id}-lesson-${n}`,
      title: `Урок ${n}`,
    }));

    let completedCount = 0;
    let lastCompletedIndex = -1;

    if (isPlatformBrowser(this.platformId)) {
      lessons.forEach((l, idx) => {
        const raw = window.localStorage.getItem(`lesson:${l.id}:progress`);
        if (raw === '100') {
          completedCount += 1;
          lastCompletedIndex = idx;
        }
      });
    }

    const progressPercent = Math.round((completedCount / lessons.length) * 100);
    const lastCompletedLessonTitle =
      lastCompletedIndex >= 0 ? lessons[lastCompletedIndex].title : '—';
    const completed = completedCount === lessons.length;

    return {
      course,
      progressPercent,
      lastCompletedLessonTitle,
      completed,
    };
  }

  private loadCertificates(): CertificateRecord[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }
    const raw = window.localStorage.getItem('certificates');
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as CertificateRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
