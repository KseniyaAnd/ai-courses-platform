import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-auth',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDividerModule,
  ],
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss'],
})
export class AuthComponent {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
  protected readonly activeTabIndex = signal(
    this.route.snapshot.queryParamMap.get('mode') === 'register' ? 1 : 0,
  );

  protected readonly loginForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    rememberMe: new FormControl<boolean>(true, { nonNullable: true }),
  });

  protected readonly registerForm = new FormGroup(
    {
      name: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      email: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
      confirmPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
      agree: new FormControl<boolean>(false, {
        nonNullable: true,
        validators: [Validators.requiredTrue],
      }),
      rememberMe: new FormControl<boolean>(true, { nonNullable: true }),
    },
    { validators: [passwordsMatchValidator] },
  );

  protected get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authService.loginWithCredentials({
      email: this.loginForm.controls.email.value,
      password: this.loginForm.controls.password.value,
      rememberMe: this.loginForm.controls.rememberMe.value,
    });

    void this.router.navigateByUrl(this.returnUrl);
  }

  protected submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.authService.register(
      {
        name: this.registerForm.controls.name.value,
        email: this.registerForm.controls.email.value,
        password: this.registerForm.controls.password.value,
      },
      this.registerForm.controls.rememberMe.value,
    );

    void this.router.navigateByUrl(this.returnUrl);
  }

  protected forgotPassword(): void {
    // Placeholder
    alert('Сброс пароля: заглушка');
  }

  protected socialLogin(provider: 'google' | 'facebook'): void {
    // Placeholder
    const email = provider === 'google' ? 'google.user@example.com' : 'facebook.user@example.com';
    this.authService.loginWithCredentials({ email, password: 'oauth', rememberMe: true });
    void this.router.navigateByUrl(this.returnUrl);
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/');
  }
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!password || !confirm) {
    return null;
  }
  return password === confirm ? null : { passwordMismatch: true };
}
