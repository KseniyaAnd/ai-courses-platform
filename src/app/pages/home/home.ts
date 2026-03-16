import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';

type CourseCardVm = {
  id: string;
  title: string;
  author: string;
  rating: number;
  ratingCount: number;
  price: number;
  imageUrl: string;
};

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly year = new Date().getFullYear();

  protected readonly popularCols = signal(4);
  protected readonly newCols = signal(4);
  protected readonly gridRowHeight = signal('1:1.1');

  protected readonly popularCourses = signal<CourseCardVm[]>([
    {
      id: 'angular-material',
      title: 'Angular + Material: практический курс',
      author: 'K. And',
      rating: 4.7,
      ratingCount: 12845,
      price: 19.99,
      imageUrl: 'https://picsum.photos/seed/angular/640/360',
    },
    {
      id: 'ts-bootcamp',
      title: 'TypeScript Bootcamp: от нуля до уверенности',
      author: 'Frontend Lab',
      rating: 4.6,
      ratingCount: 9032,
      price: 16.99,
      imageUrl: 'https://picsum.photos/seed/typescript/640/360',
    },
    {
      id: 'rxjs',
      title: 'RxJS на практике: реактивное мышление',
      author: 'Reactive Academy',
      rating: 4.5,
      ratingCount: 6521,
      price: 14.99,
      imageUrl: 'https://picsum.photos/seed/rxjs/640/360',
    },
    {
      id: 'clean-frontend',
      title: 'Clean Frontend Architecture',
      author: 'Software Craft',
      rating: 4.8,
      ratingCount: 4120,
      price: 21.99,
      imageUrl: 'https://picsum.photos/seed/frontend/640/360',
    },
    {
      id: 'css-layout',
      title: 'Современные CSS-layouts: Grid + Flex',
      author: 'UI Studio',
      rating: 4.4,
      ratingCount: 10987,
      price: 12.99,
      imageUrl: 'https://picsum.photos/seed/css/640/360',
    },
    {
      id: 'node-api',
      title: 'Node.js API для фронтендеров',
      author: 'Backend Basics',
      rating: 4.3,
      ratingCount: 7811,
      price: 13.99,
      imageUrl: 'https://picsum.photos/seed/node/640/360',
    },
    {
      id: 'testing',
      title: 'Тестирование фронтенда: Jest + Cypress',
      author: 'QA Pro',
      rating: 4.6,
      ratingCount: 3344,
      price: 17.99,
      imageUrl: 'https://picsum.photos/seed/testing/640/360',
    },
    {
      id: 'ux',
      title: 'UX для разработчиков: практические паттерны',
      author: 'Design Craft',
      rating: 4.5,
      ratingCount: 5870,
      price: 15.99,
      imageUrl: 'https://picsum.photos/seed/ux/640/360',
    },
  ]);

  protected readonly newCourses = signal<CourseCardVm[]>([
    {
      id: 'signals',
      title: 'Angular Signals: современный стейт-менеджмент',
      author: 'Angular Team (Community)',
      rating: 4.7,
      ratingCount: 912,
      price: 18.99,
      imageUrl: 'https://picsum.photos/seed/signals/640/360',
    },
    {
      id: 'ssr',
      title: 'Angular SSR и производительность',
      author: 'Perf Lab',
      rating: 4.5,
      ratingCount: 544,
      price: 19.99,
      imageUrl: 'https://picsum.photos/seed/ssr/640/360',
    },
    {
      id: 'a11y',
      title: 'Accessibility: делаем интерфейсы доступными',
      author: 'A11y Studio',
      rating: 4.6,
      ratingCount: 378,
      price: 13.99,
      imageUrl: 'https://picsum.photos/seed/a11y/640/360',
    },
    {
      id: 'material3',
      title: 'Material Design 3 в Angular приложениях',
      author: 'UI Lab',
      rating: 4.4,
      ratingCount: 421,
      price: 16.99,
      imageUrl: 'https://picsum.photos/seed/material/640/360',
    },
  ]);

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
          this.popularCols.set(1);
          this.newCols.set(1);
          this.gridRowHeight.set('1:1.25');
          return;
        }

        if (state.breakpoints[Breakpoints.Small]) {
          this.popularCols.set(2);
          this.newCols.set(2);
          this.gridRowHeight.set('1:1.15');
          return;
        }

        if (state.breakpoints[Breakpoints.Medium]) {
          this.popularCols.set(3);
          this.newCols.set(3);
          this.gridRowHeight.set('1:1.1');
          return;
        }

        this.popularCols.set(4);
        this.newCols.set(4);
        this.gridRowHeight.set('1:1.05');
      });
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
}
