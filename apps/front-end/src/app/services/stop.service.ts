import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RequestStop, Stop } from '../models';
import { StopRow } from '../models/api/stop-row';
import { mapStop, stopWriteModel } from '../models/entity.mappers';
import { ApiClient } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class StopService {
  constructor(private api: ApiClient) {}
  list$(): Observable<Stop[]> {
    return this.api.list$<StopRow>('stops').pipe(map((rows) => rows.map(mapStop)));
  }
  async add(stop: RequestStop): Promise<void> { await this.api.create('stops', { id: crypto.randomUUID(), ...stopWriteModel(stop) }); }
  async update(id: string, patch: Partial<Omit<Stop, 'id'>>): Promise<void> { await this.api.update('stops', id, stopWriteModel(patch)); }
  async remove(id: string): Promise<void> { await this.api.remove('stops', id); }
}
