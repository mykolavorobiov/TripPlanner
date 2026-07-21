import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { Hotel, RequestHotel } from '../models/hotel';
import type { HotelRow } from '../models/api/hotel-row';
import { hotelWriteModel, mapHotel } from '../models/entity.mappers';
import { ApiClient } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class HotelService {
  constructor(private api: ApiClient) {}
  list$(): Observable<Hotel[]> {
    return this.api.list$<HotelRow>('hotels').pipe(map((rows) => rows.map(mapHotel)));
  }
  async add(hotel: RequestHotel): Promise<void> { await this.api.create('hotels', { id: crypto.randomUUID(), ...hotelWriteModel(hotel) }); }
  async update(id: string, patch: Partial<Omit<Hotel, 'id'>>): Promise<void> { await this.api.update('hotels', id, hotelWriteModel(patch)); }
  async remove(id: string): Promise<void> { await this.api.remove('hotels', id); }
}
