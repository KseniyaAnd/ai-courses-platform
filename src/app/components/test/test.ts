import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';

import { TimerService } from '../../services/timer.service';
import { CoursesService, CourseDetail } from '../../services/courses';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

type CertificateRecord = {
  courseId: string;
  courseTitle: string;
  scorePercent: number;
  passingScorePercent: number;
  attempt: number;
  obtainedAt: number;
};

type TestQuestion = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
};

@Component({
  selector: 'app-test',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatRadioModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestComponent {
  private readonly timerService = inject(TimerService);
  private readonly coursesService = inject(CoursesService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  @Input() courseId: string | null = null;
  @Input() minutesLimit = 10;
  @Input() passingScorePercent = 80;

  protected readonly loading = signal(true);
  protected readonly started = signal(false);
  protected readonly finished = signal(false);

  protected readonly activeIndex = signal(0);
  protected readonly secondsLeft = signal(0);
  protected readonly attempt = signal(1);

  protected readonly course$ = combineLatest([
    of(null).pipe(
      map(() => this.courseId),
      switchMap((cid) => {
        const fromUrl = this.route.snapshot.queryParamMap.get('courseId');
        return of(cid ?? fromUrl ?? '');
      }),
    ),
  ]).pipe(
    map(([id]) => id),
    tap(() => this.loading.set(true)),
    switchMap((id) => (id ? this.coursesService.getCourseDetail(id) : of(null))),
    tap(() => this.loading.set(false)),
    shareReplay({ bufferSize: 1, refCount: true }),
    takeUntilDestroyed(this.destroyRef),
  );

  protected readonly questions = signal<TestQuestion[]>([
    {
      id: 'q1',
      text: 'Что такое RxJS в контексте Angular?',
      options: [
        { id: 'a', text: 'Библиотека для работы с Observables и реактивными потоками' },
        { id: 'b', text: 'UI библиотека компонентов' },
        { id: 'c', text: 'Серверный фреймворк для Node.js' },
      ],
      correctOptionId: 'a',
    },
    {
      id: 'q2',
      text: 'Для чего используются Angular Guards?',
      options: [
        { id: 'a', text: 'Для стилизации компонентов' },
        { id: 'b', text: 'Для защиты маршрутов и контроля навигации' },
        { id: 'c', text: 'Для генерации сборки' },
      ],
      correctOptionId: 'b',
    },
    {
      id: 'q3',
      text: 'Что из перечисленного относится к standalone-компонентам?',
      options: [
        { id: 'a', text: 'Компонент объявляется только в NgModule' },
        { id: 'b', text: 'Компонент может импортировать зависимости напрямую через metadata `imports`' },
        { id: 'c', text: 'Компонент не может использовать Router' },
      ],
      correctOptionId: 'b',
    },
    {
      id: 'q4',
      text: 'Какой оператор RxJS чаще всего используют для поиска с debounce?',
      options: [
        { id: 'a', text: 'debounceTime' },
        { id: 'b', text: 'merge' },
        { id: 'c', text: 'reduce' },
      ],
      correctOptionId: 'a',
    },
    {
      id: 'q5',
      text: 'Что обычно делает `switchMap`?',
      options: [
        { id: 'a', text: 'Складывает числа в потоке' },
        { id: 'b', text: 'Отменяет предыдущий внутренний запрос при новом значении' },
        { id: 'c', text: 'Буферизует значения' },
      ],
      correctOptionId: 'b',
    },
  ]);

  protected readonly form = new FormGroup({
    answers: new FormArray<FormControl<string | null>>([]),
  });

  protected readonly answersArray = this.form.controls.answers;

  protected readonly totalQuestions = computed(() => this.questions().length);
  protected readonly progressPercent = computed(() => {
    const total = this.totalQuestions();
    if (total <= 0) {
      return 0;
    }
    return Math.round(((this.activeIndex() + 1) / total) * 100);
  });

  protected readonly canGoPrev = computed(() => this.activeIndex() > 0);
  protected readonly canGoNext = computed(() => this.activeIndex() < this.totalQuestions() - 1);

  protected readonly score = computed(() => {
    const qs = this.questions();
    const answers = this.answersArray.value;
    let correct = 0;
    for (let i = 0; i < qs.length; i += 1) {
      if (answers[i] && answers[i] === qs[i].correctOptionId) {
        correct += 1;
      }
    }
    return { correct, total: qs.length };
  });

  protected readonly scorePercent = computed(() => {
    const s = this.score();
    if (s.total <= 0) {
      return 0;
    }
    return Math.round((s.correct / s.total) * 100);
  });

  protected readonly passed = computed(() => this.scorePercent() >= this.passingScorePercent);

  protected readonly eligible = signal<boolean>(false);
  protected readonly eligibleReason = signal<string>('');

  constructor() {
    this.initForm();
    this.restoreAttempt();

    this.course$
      .pipe(
        tap((course) => {
          if (!course) {
            this.eligible.set(false);
            this.eligibleReason.set('Не удалось определить курс для теста.');
            return;
          }

          const allCompleted = this.areAllLessonsCompleted(course);
          this.eligible.set(allCompleted);
          this.eligibleReason.set(
            allCompleted
              ? ''
              : 'Чтобы открыть тест, просмотри все уроки (прогресс 100%).',
          );
        }),
      )
      .subscribe();
  }

  protected start(): void {
    if (!this.eligible()) {
      return;
    }

    this.started.set(true);
    this.finished.set(false);
    this.activeIndex.set(0);

    const totalSeconds = Math.max(1, Math.floor(this.minutesLimit * 60));
    this.secondsLeft.set(totalSeconds);

    this.timerService
      .countdown(totalSeconds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((remaining) => {
        if (!this.started() || this.finished()) {
          return;
        }

        this.secondsLeft.set(remaining);
        if (remaining <= 0) {
          this.finish();
        }
      });
  }

  protected finish(): void {
    this.finished.set(true);
    this.started.set(false);
    this.persistAttempt();
  }

  protected retake(): void {
    const nextAttempt = this.attempt() + 1;
    this.attempt.set(nextAttempt);
    this.persistAttempt();
    this.resetAnswers();
    this.start();
  }

  protected prev(): void {
    if (!this.canGoPrev()) {
      return;
    }
    this.activeIndex.set(this.activeIndex() - 1);
  }

  protected next(): void {
    if (!this.canGoNext()) {
      return;
    }
    this.activeIndex.set(this.activeIndex() + 1);
  }

  protected isCorrect(questionIndex: number): boolean {
    const q = this.questions()[questionIndex];
    const a = this.answersArray.at(questionIndex)?.value;
    return !!a && a === q.correctOptionId;
  }

  protected isAnswered(questionIndex: number): boolean {
    return !!this.answersArray.at(questionIndex)?.value;
  }

  protected downloadCertificate(course: CourseDetail): void {
    if (!this.passed()) {
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.saveCertificate({
      courseId: course.id,
      courseTitle: course.title,
      scorePercent: this.scorePercent(),
      passingScorePercent: this.passingScorePercent,
      attempt: this.attempt(),
      obtainedAt: Date.now(),
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // background
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // accent
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
    ctx.fillText('Student', 120, 320);

    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = '400 34px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText('for successfully passing the final test of the course', 120, 390);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 44px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(course.title, 120, 455);

    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = '400 30px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(`Score: ${this.scorePercent()}%`, 120, 530);
    ctx.fillText(`Passing score: ${this.passingScorePercent}%`, 120, 575);
    ctx.fillText(`Attempt: ${this.attempt()}`, 120, 620);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '400 24px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(new Date().toLocaleString(), 120, 790);

    const a = document.createElement('a');
    a.download = `certificate-${course.id}-${this.scorePercent()}pct.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  private saveCertificate(cert: CertificateRecord): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const key = 'certificates';
    const raw = window.localStorage.getItem(key);
    let all: CertificateRecord[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CertificateRecord[];
        if (Array.isArray(parsed)) {
          all = parsed;
        }
      } catch {
        all = [];
      }
    }

    // Keep only latest certificate per course
    const filtered = all.filter((c) => c.courseId !== cert.courseId);
    filtered.unshift(cert);
    window.localStorage.setItem(key, JSON.stringify(filtered));
  }

  protected formatTime(seconds: number): string {
    const s = Math.max(0, seconds);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }

  private initForm(): void {
    const qs = this.questions();
    const controls = qs.map(() => new FormControl<string | null>(null, Validators.required));
    this.form.setControl('answers', new FormArray<FormControl<string | null>>(controls));
  }

  private resetAnswers(): void {
    this.answersArray.controls.forEach((c) => c.setValue(null));
    this.answersArray.markAsPristine();
    this.answersArray.markAsUntouched();
  }

  private areAllLessonsCompleted(course: CourseDetail): boolean {
    // LessonComponent stores progress in localStorage: lesson:<lessonId>:progress
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return course.lessons.every((l) => {
      const raw = window.localStorage.getItem(`lesson:${l.id}:progress`);
      return raw === '100';
    });
  }

  private attemptStorageKey(): string {
    const id = this.courseId ?? this.route.snapshot.queryParamMap.get('courseId') ?? 'unknown';
    return `test:${id}:attempt`;
  }

  private persistAttempt(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.localStorage.setItem(this.attemptStorageKey(), String(this.attempt()));
  }

  private restoreAttempt(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const raw = window.localStorage.getItem(this.attemptStorageKey());
    if (!raw) {
      return;
    }
    const v = Number.parseInt(raw, 10);
    if (Number.isFinite(v) && v >= 1) {
      this.attempt.set(v);
    }
  }
}
