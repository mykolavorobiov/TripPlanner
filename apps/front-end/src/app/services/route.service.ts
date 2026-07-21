import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RequestRoute, Route } from '../models/route';
import { RouteRow } from '../models/api/route-row';
import { mapRoute } from '../models/entity.mappers';
import { ApiClient } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class RouteService {
  constructor(private api: ApiClient) {}
  list$(): Observable<Route[]> {
    return this.api.list$<RouteRow>('routes').pipe(map((rows) => rows.map(mapRoute)));
  }
  async add(route: RequestRoute): Promise<string> {
    const id = crypto.randomUUID();
    await this.api.create('routes', { id, ...route });
    return id;
  }
  async update(id: string, patch: Partial<RequestRoute>): Promise<void> { await this.api.update('routes', id, patch); }
  async remove(id: string): Promise<void> { await this.api.remove('routes', id); }
}
