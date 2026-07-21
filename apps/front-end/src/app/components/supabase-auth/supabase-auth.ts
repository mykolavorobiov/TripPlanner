// src/app/auth/auth.component.ts

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { AuthService } from '../../services/auth.service';


type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    ReactiveFormsModule,
  ],
  templateUrl: './supabase-auth.html',
  styleUrl: './supabase-auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupaBaseAuthComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly mode = signal<AuthMode>('login');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
      ],
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
      ],
    ],
  });

  setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.errorMessage.set(null);
    this.infoMessage.set(null);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    const { email, password } =
      this.form.getRawValue();

    try {
      if (this.mode() === 'register') {
        const result = await this.auth.signUp(
          email,
          password,
        );

        if (result.requiresEmailConfirmation) {
          this.infoMessage.set(
            'Акаунт створено. Перевір пошту та підтвердь email.',
          );

          return;
        }
      } else {
        await this.auth.signIn(email, password);
      }

      const returnUrl =
        this.route.snapshot.queryParamMap.get(
          'returnUrl',
        ) ?? '/map';

      await this.router.navigateByUrl(returnUrl);
    } catch (error: unknown) {
      this.errorMessage.set(
        this.getErrorMessage(error),
      );
    } finally {
      this.loading.set(false);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Сталася невідома помилка.';
  }
}
