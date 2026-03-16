import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  CourseCategory,
  CourseListItem,
  CoursesPage,
  CoursesQuery,
  CoursesService,
  CourseSort,
} from '../../services/courses';

type CoursesVm = {
  items: CoursesPage['items'];
  total: number;
  pageIndex: number;
  pageSize: number;
  cols: number;
  loading: boolean;
};

@Component({
  selector: 'app-courses',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatGridListModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './courses.html',
  styleUrl: './courses.scss',
})
export class CoursesComponent {
  private readonly coursesService = inject(CoursesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = this.coursesService.getCategories();
  protected readonly sortOptions: { value: CourseSort; label: string }[] = [
    { value: 'popular', label: 'Популярности' },
    { value: 'newest', label: 'Новизне' },
    { value: 'price_asc', label: 'Цене (по возрастанию)' },
    { value: 'price_desc', label: 'Цене (по убыванию)' },
  ];

  protected readonly cols = signal(4);
  protected readonly rowHeight = signal('1:1.1');

  protected readonly stars = [1, 2, 3, 4, 5];

  protected readonly form = new FormGroup({
    q: new FormControl<string>('', { nonNullable: true }),
    categories: new FormControl<CourseCategory[]>([], { nonNullable: true }),
    sort: new FormControl<CourseSort>('popular', { nonNullable: true }),
  });

  private readonly page$ = new BehaviorSubject<{ pageIndex: number; pageSize: number }>({
    pageIndex: 0,
    pageSize: 12,
  });

  protected readonly vm$ = combineLatest([
    this.route.queryParamMap.pipe(
      map((m) => {
        const q = m.get('q') ?? '';
        const sort = (m.get('sort') as CourseSort) ?? 'popular';
        const categories = (m.getAll('cat') as CourseCategory[]) ?? [];
        const pageIndex = Number.parseInt(m.get('page') ?? '0', 10);
        const pageSize = Number.parseInt(m.get('size') ?? '12', 10);

        return {
          q,
          sort: this.isSort(sort) ? sort : 'popular',
          categories: categories.filter((c) => this.categories.includes(c)),
          pageIndex: Number.isFinite(pageIndex) && pageIndex >= 0 ? pageIndex : 0,
          pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 12,
        };
      }),
      tap((state) => {
        this.form.setValue(
          {
            q: state.q,
            categories: state.categories,
            sort: state.sort,
          },
          { emitEvent: false },
        );
        this.page$.next({ pageIndex: state.pageIndex, pageSize: state.pageSize });
      }),
    ),
    this.form.valueChanges.pipe(
      startWith(this.form.getRawValue()),
      debounceTime(250),
      map((v) => ({
        q: v.q ?? '',
        categories: (v.categories ?? []) as CourseCategory[],
        sort: (v.sort ?? 'popular') as CourseSort,
      })),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      tap(() => {
        const current = this.page$.value;
        if (current.pageIndex !== 0) {
          this.page$.next({ ...current, pageIndex: 0 });
        }
      }),
    ),
    this.page$.pipe(distinctUntilChanged((a, b) => a.pageIndex === b.pageIndex && a.pageSize === b.pageSize)),
  ]).pipe(
    map(([_, formState, pageState]) => ({ ...formState, ...pageState })),
    tap((state) => {
      const queryParams = {
        q: state.q || null,
        sort: state.sort !== 'popular' ? state.sort : null,
        page: state.pageIndex !== 0 ? state.pageIndex : null,
        size: state.pageSize !== 12 ? state.pageSize : null,
        cat: state.categories.length > 0 ? state.categories : null,
      };

      const current = this.route.snapshot.queryParams;
      const nextNormalized = JSON.stringify({
        q: queryParams.q ?? null,
        sort: queryParams.sort ?? null,
        page: queryParams.page ?? null,
        size: queryParams.size ?? null,
        cat: Array.isArray(queryParams.cat) ? queryParams.cat : queryParams.cat ? [queryParams.cat] : [],
      });
      const currentNormalized = JSON.stringify({
        q: current['q'] ?? null,
        sort: current['sort'] ?? null,
        page: current['page'] ?? null,
        size: current['size'] ?? null,
        cat: Array.isArray(current['cat']) ? current['cat'] : current['cat'] ? [current['cat']] : [],
      });

      if (nextNormalized !== currentNormalized) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams,
          queryParamsHandling: '',
          replaceUrl: true,
        });
      }
    }),
    switchMap((state) => {
      const query: CoursesQuery = {
        q: state.q,
        categories: state.categories,
        sort: state.sort,
        pageIndex: state.pageIndex,
        pageSize: state.pageSize,
      };

      return this.coursesService.queryCourses(query).pipe(
        map((page) => ({ page, state, loading: false })),
        startWith({ page: { items: [], total: 0 }, state, loading: true } as {
          page: CoursesPage;
          state: { q: string; categories: CourseCategory[]; sort: CourseSort; pageIndex: number; pageSize: number };
          loading: boolean;
        }),
      );
    }),
    map(({ page, state, loading }) => {
      return {
        items: page.items,
        total: page.total,
        pageIndex: state.pageIndex,
        pageSize: state.pageSize,
        cols: this.cols(),
        loading,
      } satisfies CoursesVm;
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (state.breakpoints[Breakpoints.XSmall]) {
          this.cols.set(1);
          this.rowHeight.set('1:1.25');
          return;
        }

        if (state.breakpoints[Breakpoints.Small]) {
          this.cols.set(2);
          this.rowHeight.set('1:1.15');
          return;
        }

        if (state.breakpoints[Breakpoints.Medium]) {
          this.cols.set(3);
          this.rowHeight.set('1:1.1');
          return;
        }

        this.cols.set(4);
        this.rowHeight.set('1:1.05');
      });
  }

  protected onPageChange(event: PageEvent): void {
    this.page$.next({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }

  protected formatPrice(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  }

  protected formatRatingCount(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
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

  private isSort(value: string): value is CourseSort {
    return value === 'popular' || value === 'price_asc' || value === 'price_desc' || value === 'newest';
  }

  protected trackByValue(_index: number, value: string): string {
    return value;
  }

  protected trackByNumber(_index: number, value: number): number {
    return value;
  }

  protected trackByCourseId(_index: number, course: CourseListItem): string {
    return course.id;
  }

  protected trackBySortValue(_index: number, option: { value: CourseSort }): CourseSort {
    return option.value;
  }
}
