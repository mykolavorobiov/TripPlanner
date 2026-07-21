import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, switchMap, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  list$<T>(entity: string, interval = 5_000): Observable<T[]> {
    return timer(0, interval).pipe(
      switchMap(() =>
        this.http.get<T[]>(`${environment.apiUrl}/${entity}`, this.options()),
      ),
    );
  }

  get<T>(path: string): Promise<T> {
    return firstValueFrom(
      this.http.get<T>(`${environment.apiUrl}/${path}`, this.options()),
    );
  }

  post<T>(path: string, body: unknown, authenticated = true): Promise<T> {
    return firstValueFrom(
      this.http.post<T>(
        `${environment.apiUrl}/${path}`,
        body,
        authenticated ? this.options() : {},
      ),
    );
  }

  create<T>(entity: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.http.post<T>(
        `${environment.apiUrl}/${entity}`,
        body,
        this.options(),
      ),
    );
  }

  update<T>(entity: string, id: string | number, body: unknown): Promise<T> {
    return firstValueFrom(
      this.http.patch<T>(
        `${environment.apiUrl}/${entity}/${id}`,
        body,
        this.options(),
      ),
    );
  }

  remove(entity: string, id: string | number): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(
        `${environment.apiUrl}/${entity}/${id}`,
        this.options(),
      ),
    );
  }

  private options(): { headers: HttpHeaders } {
    const token = this.auth.accessToken;
    return {
      headers: new HttpHeaders(
        token ? { Authorization: `Bearer ${token}` } : {},
      ),
    };
  }
}
