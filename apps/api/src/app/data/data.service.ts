import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.constants';
import { EntityName, entityConfigurations } from './data.models';

@Injectable()
export class DataService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async list(entityValue: string) {
    const entity = this.entity(entityValue);
    const config = entityConfigurations[entity];
    const selection = entity === 'stops' ? '*, stop_tags(tag_id)' : '*';
    const { data, error } = await this.supabase
      .from(config.table)
      .select(selection)
      .order(config.order, { ascending: config.ascending });
    if (error) throw error;
    return data;
  }

  async create(entityValue: string, body: Record<string, unknown>, userId: string) {
    const entity = this.entity(entityValue);
    const config = entityConfigurations[entity];
    const tagIds = entity === 'stops' ? this.tagIds(body) : undefined;
    const row = this.cleanBody(body);
    row.created_by = userId;

    const { data, error } = await this.supabase
      .from(config.table)
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    if (entity === 'stops' && tagIds?.length) await this.replaceStopTags(String(data.id), tagIds);
    return data;
  }

  async update(entityValue: string, id: string, body: Record<string, unknown>) {
    const entity = this.entity(entityValue);
    const config = entityConfigurations[entity];
    const tagIds = entity === 'stops' ? this.tagIds(body) : undefined;
    const { data, error } = await this.supabase
      .from(config.table)
      .update(this.cleanBody(body))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    if (entity === 'stops' && tagIds !== undefined) await this.replaceStopTags(id, tagIds);
    return data;
  }

  async remove(entityValue: string, id: string) {
    const entity = this.entity(entityValue);
    const { error } = await this.supabase
      .from(entityConfigurations[entity].table)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }

  private entity(value: string): EntityName {
    if (!(value in entityConfigurations)) throw new BadRequestException('Unknown entity');
    return value as EntityName;
  }

  private tagIds(body: Record<string, unknown>): string[] | undefined {
    if (!('tag_ids' in body)) return undefined;
    if (!Array.isArray(body.tag_ids)) throw new BadRequestException('tag_ids must be an array');
    return body.tag_ids.map(String);
  }

  private cleanBody(body: Record<string, unknown>): Record<string, unknown> {
    const { tag_ids: _tagIds, created_by: _createdBy, created_at: _createdAt, updated_at: _updatedAt, ...clean } = body;
    return clean;
  }

  private async replaceStopTags(stopId: string, tagIds: string[]): Promise<void> {
    const { error: deleteError } = await this.supabase
      .from('stop_tags')
      .delete()
      .eq('stop_id', stopId);
    if (deleteError) throw deleteError;
    if (!tagIds.length) return;
    const { error } = await this.supabase
      .from('stop_tags')
      .insert(tagIds.map((tagId) => ({ stop_id: stopId, tag_id: tagId })));
    if (error) throw error;
  }
}
