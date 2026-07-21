import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  hide = true;
  loading = false;
  error = '';
  currentLocale = $localize.locale ?? 'uk';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  private async run<T>(fn: () => Promise<T>) {
    this.error = '';
    this.loading = true;
    try {
      return await fn();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      this.error = err?.code
        ? $localize`:@@auth.errorPrefix:Помилка: ${err.code}:errorCode:`
        : (err?.message ?? String(e));
      throw e;
    } finally {
      this.loading = false;
    }
  }

  async login() {
    const { email, password } = this.form.getRawValue();
    await this.run(() => this.auth.login(email!, password!));
    this.router.navigateByUrl('/list');
  }

  signup() {
    const { email, password } = this.form.getRawValue();
    return this.run(() => this.auth.signup(email!, password!));
  }

  google() {
    return this.run(() => this.auth.loginWithGoogle());
  }

  logout() {
    return this.run(() => this.auth.logout());
  }

  localizedPath(locale: 'uk' | 'en'): string {
    const { pathname, search, hash } = this.document.location;
    const routePath = pathname.replace(/^\/(uk|en)(?=\/|$)/, '') || '/';

    return `/${locale}${routePath}${search}${hash}`;
  }

  isLocale(locale: 'uk' | 'en'): boolean {
    return this.currentLocale.toLowerCase().startsWith(locale);
  }
}
