import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export type CourseCategory =
  | 'Web Development'
  | 'Frontend'
  | 'Backend'
  | 'Design'
  | 'Testing'
  | 'DevOps';

export type CourseSort = 'popular' | 'price_asc' | 'price_desc' | 'newest';

export type CoursesQuery = {
  q: string;
  categories: CourseCategory[];
  sort: CourseSort;
  pageIndex: number;
  pageSize: number;
};

export type CourseListItem = {
  id: string;
  title: string;
  description: string;
  author: string;
  rating: number;
  ratingCount: number;
  price: number;
  imageUrl: string;
  categories: CourseCategory[];
  createdAt: string; // ISO
  popularity: number;
};

export type CoursesPage = {
  items: CourseListItem[];
  total: number;
};

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type LessonAccessStatus = 'locked' | 'available' | 'completed';

export type CourseLesson = {
  id: string;
  title: string;
  durationMinutes: number;
  status: LessonAccessStatus;
  taskDone: boolean;
  contentPreview: string;
};

export type CourseDetail = {
  id: string;
  title: string;
  description: string;
  author: string;
  rating: number;
  ratingCount: number;
  price: number;
  imageUrl: string;
  categories: CourseCategory[];
  level: CourseLevel;
  totalDurationMinutes: number;
  lessonsCount: number;
  lessons: CourseLesson[];
  aboutInstructor: string;
  reviews: { userName: string; rating: number; text: string }[];
};

@Injectable({
  providedIn: 'root',
})
export class CoursesService {
  private readonly allCourses: CourseListItem[] = [
    {
      id: 'angular-material',
      title: 'Angular + Material: практический курс',
      description: 'Собери современное Angular приложение с Material UI и лучшими практиками.',
      author: 'K. And',
      rating: 4.7,
      ratingCount: 12845,
      price: 19.99,
      imageUrl: 'https://picsum.photos/seed/angular/640/360',
      categories: ['Frontend', 'Web Development'],
      createdAt: '2026-02-10T00:00:00.000Z',
      popularity: 980,
    },
    {
      id: 'ts-bootcamp',
      title: 'TypeScript Bootcamp: от нуля до уверенности',
      description: 'Типы, generics, утилиты, архитектура и реальные примеры для работы.',
      author: 'Frontend Lab',
      rating: 4.6,
      ratingCount: 9032,
      price: 16.99,
      imageUrl: 'https://picsum.photos/seed/typescript/640/360',
      categories: ['Frontend', 'Web Development'],
      createdAt: '2025-12-21T00:00:00.000Z',
      popularity: 840,
    },
    {
      id: 'rxjs',
      title: 'RxJS на практике: реактивное мышление',
      description: 'Операторы, композиция, обработка ошибок и паттерны для Angular.',
      author: 'Reactive Academy',
      rating: 4.5,
      ratingCount: 6521,
      price: 14.99,
      imageUrl: 'https://picsum.photos/seed/rxjs/640/360',
      categories: ['Frontend', 'Web Development'],
      createdAt: '2026-01-05T00:00:00.000Z',
      popularity: 760,
    },
    {
      id: 'clean-frontend',
      title: 'Clean Frontend Architecture',
      description: 'Модульность, слои, зависимости и масштабирование фронтенд-проекта.',
      author: 'Software Craft',
      rating: 4.8,
      ratingCount: 4120,
      price: 21.99,
      imageUrl: 'https://picsum.photos/seed/frontend/640/360',
      categories: ['Frontend', 'Web Development'],
      createdAt: '2025-11-18T00:00:00.000Z',
      popularity: 690,
    },
    {
      id: 'node-api',
      title: 'Node.js API для фронтендеров',
      description: 'REST, авторизация, базы данных и деплой — чтобы уверенно работать с API.',
      author: 'Backend Basics',
      rating: 4.3,
      ratingCount: 7811,
      price: 13.99,
      imageUrl: 'https://picsum.photos/seed/node/640/360',
      categories: ['Backend', 'Web Development'],
      createdAt: '2025-10-02T00:00:00.000Z',
      popularity: 720,
    },
    {
      id: 'testing',
      title: 'Тестирование фронтенда: Jest + Cypress',
      description: 'Юнит, интеграционные и e2e тесты, стратегии и стабильные пайплайны.',
      author: 'QA Pro',
      rating: 4.6,
      ratingCount: 3344,
      price: 17.99,
      imageUrl: 'https://picsum.photos/seed/testing/640/360',
      categories: ['Testing', 'Web Development'],
      createdAt: '2026-02-25T00:00:00.000Z',
      popularity: 640,
    },
    {
      id: 'ux',
      title: 'UX для разработчиков: практические паттерны',
      description: 'Сетка, иерархия, контраст, UX-ошибки и быстрые улучшения интерфейса.',
      author: 'Design Craft',
      rating: 4.5,
      ratingCount: 5870,
      price: 15.99,
      imageUrl: 'https://picsum.photos/seed/ux/640/360',
      categories: ['Design'],
      createdAt: '2025-09-14T00:00:00.000Z',
      popularity: 610,
    },
    {
      id: 'devops-essentials',
      title: 'DevOps Essentials: CI/CD для веб-проектов',
      description: 'GitHub Actions, Docker основы и деплой без боли.',
      author: 'DevOps School',
      rating: 4.4,
      ratingCount: 1290,
      price: 18.49,
      imageUrl: 'https://picsum.photos/seed/devops/640/360',
      categories: ['DevOps'],
      createdAt: '2026-03-01T00:00:00.000Z',
      popularity: 540,
    },
    {
      id: 'material3',
      title: 'Material Design 3 в Angular приложениях',
      description: 'Компоненты, темы, адаптивность и UI-паттерны на Material 3.',
      author: 'UI Lab',
      rating: 4.4,
      ratingCount: 421,
      price: 16.99,
      imageUrl: 'https://picsum.photos/seed/material/640/360',
      categories: ['Design', 'Frontend'],
      createdAt: '2026-03-05T00:00:00.000Z',
      popularity: 480,
    },
    {
      id: 'a11y',
      title: 'Accessibility: делаем интерфейсы доступными',
      description: 'WCAG, семантика, клавиатурная навигация и доступные компоненты.',
      author: 'A11y Studio',
      rating: 4.6,
      ratingCount: 378,
      price: 13.99,
      imageUrl: 'https://picsum.photos/seed/a11y/640/360',
      categories: ['Frontend', 'Design'],
      createdAt: '2026-02-28T00:00:00.000Z',
      popularity: 450,
    },
    {
      id: 'ssr',
      title: 'Angular SSR и производительность',
      description: 'SSR/SSG, кеширование и метрики для быстрого Angular приложения.',
      author: 'Perf Lab',
      rating: 4.5,
      ratingCount: 544,
      price: 19.99,
      imageUrl: 'https://picsum.photos/seed/ssr/640/360',
      categories: ['Frontend', 'Web Development'],
      createdAt: '2026-02-18T00:00:00.000Z',
      popularity: 520,
    },
  ];

  getCategories(): CourseCategory[] {
    return [
      'Web Development',
      'Frontend',
      'Backend',
      'Design',
      'Testing',
      'DevOps',
    ];
  }

  getCoursesByIds(ids: string[]): CourseListItem[] {
    const set = new Set(ids);
    return this.allCourses.filter((c) => set.has(c.id));
  }

  getCourseDetail(courseId: string): Observable<CourseDetail | null> {
    const base = this.allCourses.find((c) => c.id === courseId);

    if (!base) {
      return of(null).pipe(delay(150));
    }

    const level: CourseLevel =
      base.popularity >= 800
        ? 'Beginner'
        : base.popularity >= 600
          ? 'Intermediate'
          : 'Advanced';

    const lessonsRaw = [
      { title: 'Введение и цели курса', durationMinutes: 8 },
      { title: 'Настройка окружения', durationMinutes: 12 },
      { title: 'Основы: ключевые концепции', durationMinutes: 18 },
      { title: 'Практика: мини‑проект', durationMinutes: 25 },
      { title: 'Задание и разбор типичных ошибок', durationMinutes: 16 },
      { title: 'Итоги и следующие шаги', durationMinutes: 10 },
    ];

    const lessons: CourseLesson[] = lessonsRaw.map((l, idx) => ({
      id: `${courseId}-lesson-${idx + 1}`,
      title: l.title,
      durationMinutes: l.durationMinutes,
      status: idx === 0 ? 'available' : 'locked',
      taskDone: false,
      contentPreview: 'Короткий превью‑текст урока. Полный контент будет доступен после записи.',
    }));

    const totalDurationMinutes = lessons.reduce(
      (sum, l) => sum + l.durationMinutes,
      0,
    );

    const detail: CourseDetail = {
      id: base.id,
      title: base.title,
      description: base.description,
      author: base.author,
      rating: base.rating,
      ratingCount: base.ratingCount,
      price: base.price,
      imageUrl: base.imageUrl,
      categories: base.categories,
      level,
      totalDurationMinutes,
      lessonsCount: lessons.length,
      lessons,
      aboutInstructor:
        'Преподаватель — практикующий специалист. Делится опытом, паттернами и подходами из реальных проектов.',
      reviews: [
        {
          userName: 'Алексей',
          rating: 5,
          text: 'Очень структурно и практично. Понравились задания и объяснения.',
        },
        {
          userName: 'Мария',
          rating: 4,
          text: 'Отличный курс, хотелось бы чуть больше примеров для продвинутых.',
        },
        {
          userName: 'Дмитрий',
          rating: 5,
          text: 'Супер! Наконец-то всё встало на свои места.',
        },
      ],
    };

    return of(detail).pipe(delay(200));
  }

  queryCourses(query: CoursesQuery): Observable<CoursesPage> {
    const q = query.q.trim().toLowerCase();
    const selectedCategories = new Set(query.categories);

    let filtered = this.allCourses.slice();

    if (q.length > 0) {
      filtered = filtered.filter((c) => c.title.toLowerCase().includes(q));
    }

    if (selectedCategories.size > 0) {
      filtered = filtered.filter((c) =>
        c.categories.some((cat) => selectedCategories.has(cat)),
      );
    }

    switch (query.sort) {
      case 'popular':
        filtered.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }

    const total = filtered.length;
    const start = query.pageIndex * query.pageSize;
    const end = start + query.pageSize;
    const items = filtered.slice(start, end);

    return of({ items, total }).pipe(delay(150));
  }
}
