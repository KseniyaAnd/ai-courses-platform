import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./pages/auth/auth').then((m) => m.AuthComponent),
  },
  {
    path: 'courses',
    loadComponent: () =>
      import('./pages/courses/courses').then((m) => m.CoursesComponent),
  },
  {
    path: 'courses/:id',
    loadComponent: () =>
      import('./pages/course-detail/course-detail').then(
        (m) => m.CourseDetailComponent,
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile').then((m) => m.ProfileComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
