import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  Subject,
  firstValueFrom,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly listStreams = new Map<string, Observable<unknown[]>>();
  private readonly refreshSignals = new Map<string, Subject<void>>();

  list$<T>(entity: string): Observable<T[]> {
    let stream = this.listStreams.get(entity);
    if (!stream) {
      stream = this.refreshSignal(entity).pipe(
        startWith(undefined),
        switchMap(() =>
          this.http.get<unknown[]>(
            `${environment.apiUrl}/${entity}`,
            this.options(),
          ),
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
      this.listStreams.set(entity, stream);
    }
    return stream as Observable<T[]>;
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

  async create<T>(entity: string, body: unknown): Promise<T> {
    const created = await firstValueFrom(
      this.http.post<T>(
        `${environment.apiUrl}/${entity}`,
        body,
        this.options(),
      ),
    );
    this.refreshRelated(entity);
    return created;
  }

  async update<T>(
    entity: string,
    id: string | number,
    body: unknown,
  ): Promise<T> {
    const updated = await firstValueFrom(
      this.http.patch<T>(
        `${environment.apiUrl}/${entity}/${id}`,
        body,
        this.options(),
      ),
    );
    this.refreshRelated(entity);
    return updated;
  }

  async remove(entity: string, id: string | number): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(
        `${environment.apiUrl}/${entity}/${id}`,
        this.options(),
      ),
    );
    this.refreshRelated(entity);
  }

  refresh(entity: string): void {
    this.refreshSignal(entity).next();
  }

  private refreshSignal(entity: string): Subject<void> {
    let signal = this.refreshSignals.get(entity);
    if (!signal) {
      signal = new Subject<void>();
      this.refreshSignals.set(entity, signal);
    }
    return signal;
  }

  private refreshRelated(entity: string): void {
    const dependencies: Record<string, string[]> = {
      tags: ['tags', 'stops', 'hotels'],
      stops: ['stops', 'hotels'],
    };
    for (const relatedEntity of dependencies[entity] ?? [entity]) {
      this.refresh(relatedEntity);
    }
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
