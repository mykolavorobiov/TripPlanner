import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RequestTag, Tag } from '../models';
import { TagRow } from '../models/api/tag-row';
import { mapTag } from '../models/entity.mappers';
import { ApiClient } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class TagService {
  constructor(private api: ApiClient) {}

  list$(): Observable<Tag[]> {
    return this.api.list$<TagRow>('tags').pipe(map((rows) => rows.map(mapTag)));
  }
  clearCache(): void {
    this.api.refresh('tags');
  }
  async add(tag: RequestTag): Promise<void> {
    await this.api.create('tags', {
      id: crypto.randomUUID(),
      name: tag.name.trim(),
      color: tag.color ?? null,
    });
  }
  async update(id: string, patch: Partial<Omit<Tag, 'id'>>): Promise<void> {
    await this.api.update('tags', id, {
      name: patch.name?.trim(),
      color: patch.color,
    });
  }
  async remove(id: string): Promise<void> {
    await this.api.remove('tags', id);
  }
}
