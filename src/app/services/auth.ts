import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

export type AuthUser = {
  name: string;
  email: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly authenticated = signal<boolean>(false);
  private readonly enrolledCourseIds = signal<Set<string>>(new Set());

  private readonly token = signal<string | null>(null);
  private readonly user = signal<AuthUser | null>(null);
  private readonly rememberMe = signal<boolean>(true);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Token can live either in localStorage (rememberMe=true) or sessionStorage
    const tokenLocal = window.localStorage.getItem('auth:token');
    const tokenSession = window.sessionStorage.getItem('auth:token');
    const activeToken = tokenLocal ?? tokenSession;
    this.token.set(activeToken);

    const rememberRaw = window.localStorage.getItem('auth:rememberMe');
    this.rememberMe.set(rememberRaw !== 'false');

    const userRaw = window.localStorage.getItem('auth:user');
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw) as AuthUser;
        if (parsed && typeof parsed.email === 'string' && typeof parsed.name === 'string') {
          this.user.set(parsed);
        }
      } catch {
        this.user.set(null);
      }
    }

    this.authenticated.set(!!activeToken);

    const enrolledRaw = window.localStorage.getItem('auth:enrolled');
    if (enrolledRaw) {
      try {
        const parsed = JSON.parse(enrolledRaw) as string[];
        if (Array.isArray(parsed)) {
          this.enrolledCourseIds.set(
            new Set(parsed.filter((x) => typeof x === 'string')),
          );
        }
      } catch {
        this.enrolledCourseIds.set(new Set());
      }
    }
  }

  isAuthenticated(): boolean {
    return this.authenticated();
  }

  getToken(): string | null {
    return this.token();
  }

  getUser(): AuthUser | null {
    return this.user();
  }

  register(payload: RegisterPayload, rememberMe: boolean): void {
    const token = this.generateMockJwt(payload.email);
    this.setSession({
      token,
      user: { name: payload.name, email: payload.email },
      rememberMe,
    });
  }

  loginWithCredentials(payload: LoginPayload): void {
    const token = this.generateMockJwt(payload.email);
    this.setSession({
      token,
      user: { name: 'Student', email: payload.email },
      rememberMe: payload.rememberMe,
    });
  }

  // Backward compatible helper used by earlier UI
  login(): void {
    this.loginWithCredentials({
      email: this.user()?.email ?? 'student@example.com',
      password: 'password',
      rememberMe: true,
    });
  }

  logout(): void {
    this.authenticated.set(false);
    this.enrolledCourseIds.set(new Set());
    if (isPlatformBrowser(this.platformId)) {
      window.localStorage.removeItem('auth:token');
      window.sessionStorage.removeItem('auth:token');
      window.localStorage.removeItem('auth:user');
      window.localStorage.setItem('auth:rememberMe', 'false');
      window.localStorage.removeItem('auth:enrolled');
    }
    this.token.set(null);
    this.user.set(null);
  }

  isEnrolled(courseId: string): boolean {
    return this.enrolledCourseIds().has(courseId);
  }

  enroll(courseId: string): void {
    const next = new Set(this.enrolledCourseIds());
    next.add(courseId);
    this.enrolledCourseIds.set(next);
    if (isPlatformBrowser(this.platformId)) {
      window.localStorage.setItem(
        'auth:enrolled',
        JSON.stringify(Array.from(next)),
      );
    }
  }

  getEnrolledCourseIds(): string[] {
    return Array.from(this.enrolledCourseIds());
  }

  private setSession(params: { token: string; user: AuthUser; rememberMe: boolean }): void {
    this.token.set(params.token);
    this.user.set(params.user);
    this.rememberMe.set(params.rememberMe);
    this.authenticated.set(true);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Store token depending on rememberMe
    if (params.rememberMe) {
      window.localStorage.setItem('auth:token', params.token);
      window.sessionStorage.removeItem('auth:token');
      window.localStorage.setItem('auth:rememberMe', 'true');
    } else {
      window.sessionStorage.setItem('auth:token', params.token);
      window.localStorage.removeItem('auth:token');
      window.localStorage.setItem('auth:rememberMe', 'false');
    }

    window.localStorage.setItem('auth:user', JSON.stringify(params.user));
  }

  private generateMockJwt(subject: string): string {
    // Not a real JWT. Just a deterministic-ish token for demo purposes.
    const payload = {
      sub: subject,
      iat: Date.now(),
    };

    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    return `mock.${encoded}.token`;
  }
}
