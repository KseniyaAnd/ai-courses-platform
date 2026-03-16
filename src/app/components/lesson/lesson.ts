import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
  templateUrl: './lesson.html',
  styleUrls: ['./lesson.scss'],
})
export class LessonComponent implements OnInit, OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);

  @Input({ required: true }) lessonId!: string;
  @Input() title = 'Урок';
  @Input() description = 'Описание урока.';
  @Input() taskText = 'Текст задания.';
  @Input() videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  @Input() materialsUrl: string | null = null;
  @Input() prevLessonLink: string | null = null;
  @Input() nextLessonLink: string | null = null;
  @Input() commentsEnabled = true;

  protected readonly safeVideoUrl = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.videoUrl),
  );

  protected readonly progress = signal<number>(0);
  protected readonly watched = computed(() => this.progress() >= 100);
  private intervalId: number | null = null;

  protected readonly uploadForm = new FormGroup({
    fileName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    comment: new FormControl<string>('', { nonNullable: true }),
  });

  protected readonly commentText = new FormControl<string>('', { nonNullable: true });
  protected readonly comments = signal<{ id: string; text: string; createdAt: number }[]>([]);
  protected readonly lastSubmission = signal<{ fileName: string; createdAt: number } | null>(null);

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnInit(): void {
    this.restoreFromStorage();
  }

  protected onSelectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.uploadForm.controls.fileName.setValue(file?.name ?? '');
  }

  protected startWatching(): void {
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = window.setInterval(() => {
      const next = Math.min(100, this.progress() + 5);
      this.progress.set(next);
      this.persistProgress();
      if (next >= 100 && this.intervalId !== null) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }, 1000);
  }

  protected markWatched(): void {
    this.progress.set(100);
    this.persistProgress();
  }

  protected resetProgress(): void {
    this.progress.set(0);
    this.persistProgress();
  }

  protected submitTask(): void {
    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    const fileName = this.uploadForm.controls.fileName.value;
    const createdAt = Date.now();
    this.lastSubmission.set({ fileName, createdAt });
    window.localStorage.setItem(this.storageKey('submission'), JSON.stringify({ fileName, createdAt }));
    this.uploadForm.reset({ fileName: '', comment: '' });
  }

  protected addComment(): void {
    if (!this.commentsEnabled) {
      return;
    }
    const text = this.commentText.value.trim();
    if (!text) {
      return;
    }

    const next = [
      { id: crypto.randomUUID(), text, createdAt: Date.now() },
      ...this.comments(),
    ];
    this.comments.set(next);
    this.commentText.setValue('');
    window.localStorage.setItem(this.storageKey('comments'), JSON.stringify(next));
  }

  private restoreFromStorage(): void {
    const progressRaw = window.localStorage.getItem(this.storageKey('progress'));
    if (progressRaw) {
      const value = Number.parseInt(progressRaw, 10);
      if (Number.isFinite(value) && value >= 0 && value <= 100) {
        this.progress.set(value);
      }
    }

    const commentsRaw = window.localStorage.getItem(this.storageKey('comments'));
    if (commentsRaw) {
      try {
        const parsed = JSON.parse(commentsRaw) as { id: string; text: string; createdAt: number }[];
        if (Array.isArray(parsed)) {
          this.comments.set(parsed);
        }
      } catch {
        this.comments.set([]);
      }
    }

    const submissionRaw = window.localStorage.getItem(this.storageKey('submission'));
    if (submissionRaw) {
      try {
        const parsed = JSON.parse(submissionRaw) as { fileName: string; createdAt: number };
        if (parsed && typeof parsed.fileName === 'string') {
          this.lastSubmission.set(parsed);
        }
      } catch {
        this.lastSubmission.set(null);
      }
    }
  }

  private persistProgress(): void {
    window.localStorage.setItem(this.storageKey('progress'), String(this.progress()));
  }

  private storageKey(suffix: string): string {
    return `lesson:${this.lessonId}:${suffix}`;
  }
}
