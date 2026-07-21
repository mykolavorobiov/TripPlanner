import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { ReplaySubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type { ApiSession, ApiUser, RegistrationResult } from '../models/api-session';
import { readSession, writeSession } from './api-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionSignal = signal<ApiSession | null>(null);
  private readonly initializedSignal = signal(false);
  private readonly userSubject = new ReplaySubject<ApiUser | null>(1);
  private readonly initialization: Promise<void>;
  private refreshTimer?: number;

  readonly session = this.sessionSignal.asReadonly();
  readonly initialized = this.initializedSignal.asReadonly();
  readonly user = computed(() => this.sessionSignal()?.user ?? null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly user$ = this.userSubject.asObservable();

  constructor() {
    this.initialization = this.loadInitialSession();
  }

  waitUntilInitialized(): Promise<void> {
    return this.initialization;
  }

  signup(email: string, password: string): Promise<RegistrationResult> {
    return this.signUp(email, password);
  }

  async signUp(email: string, password: string): Promise<RegistrationResult> {
    const response = await this.postAuth<{ session: ApiSession | null }>('sign-up', {
      email,
      password,
    });
    this.setSession(response.session);
    return { requiresEmailConfirmation: response.session === null };
  }

  login(email: string, password: string): Promise<void> {
    return this.signIn(email, password);
  }

  async signIn(email: string, password: string): Promise<void> {
    const response = await this.postAuth<{ session: ApiSession }>('sign-in', { email, password });
    this.setSession(response.session);
  }

  async loginWithGoogle(): Promise<void> {
    const response = await firstValueFrom(
      this.http.get<{ url: string }>(`${environment.apiUrl}/auth/google`),
    );
    window.location.assign(response.url);
  }

  logout(): Promise<void> {
    return this.signOut();
  }

  async signOut(): Promise<void> {
    const session = this.sessionSignal();
    if (session) {
      try {
        await firstValueFrom(
          this.http.post(`${environment.apiUrl}/auth/sign-out`, {}, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        );
      } finally {
        this.setSession(null);
      }
      return;
    }
    this.setSession(null);
  }

  get currentUser(): ApiUser | null {
    return this.user();
  }

  private async loadInitialSession(): Promise<void> {
    const oauthSession = this.readOAuthCallback();
    let session = oauthSession ?? readSession();
    if (session?.refresh_token && (!session.expires_at || session.expires_at * 1000 < Date.now() + 60_000)) {
      try {
        const response = await this.postAuth<{ session: ApiSession }>('refresh', {
          refreshToken: session.refresh_token,
        });
        session = response.session;
      } catch {
        session = null;
      }
    }
    this.setSession(session);
  }

  private readOAuthCallback(): ApiSession | null {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken) return null;
    const encoded = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='))) as { sub: string; email?: string; exp?: number };
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: payload.exp,
      user: { id: payload.sub, email: payload.email },
    };
  }

  private postAuth<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(`${environment.apiUrl}/auth/${path}`, body));
  }

  private setSession(session: ApiSession | null): void {
    if (this.refreshTimer !== undefined) window.clearTimeout(this.refreshTimer);
    writeSession(session);
    this.sessionSignal.set(session);
    this.initializedSignal.set(true);
    this.userSubject.next(session?.user ?? null);
    if (session?.expires_at && session.refresh_token) {
      const delay = Math.max(10_000, session.expires_at * 1000 - Date.now() - 60_000);
      this.refreshTimer = window.setTimeout(() => void this.refreshSession(session.refresh_token), delay);
    }
  }

  private async refreshSession(refreshToken: string): Promise<void> {
    try {
      const response = await this.postAuth<{ session: ApiSession }>('refresh', { refreshToken });
      this.setSession(response.session);
    } catch {
      this.setSession(null);
    }
  }
}
