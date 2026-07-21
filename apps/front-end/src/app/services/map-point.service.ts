import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { MapPoint, RequestMapPoint } from '../models/map-point';
import { MapPointRow } from '../models/api/map-point-row';
import { mapMapPoint } from '../models/entity.mappers';
import { ApiClient } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class MapPointService {
  constructor(private api: ApiClient) {}
  list$(): Observable<MapPoint[]> {
    return this.api.list$<MapPointRow>('map-points').pipe(map((rows) => rows.map(mapMapPoint)));
  }
  async add(point: RequestMapPoint): Promise<void> { await this.api.create('map-points', { id: crypto.randomUUID(), ...point }); }
  async update(id: string, patch: Pick<MapPoint, 'label' | 'lat' | 'lng' | 'color'>): Promise<void> { await this.api.update('map-points', id, patch); }
  async remove(id: string): Promise<void> { await this.api.remove('map-points', id); }
}
