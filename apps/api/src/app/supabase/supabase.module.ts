import { Module } from '@nestjs/common';
import { supabaseClientProvider } from './supabase-client.provider';
import { SUPABASE_CLIENT } from './supabase.constants';

@Module({
  providers: [supabaseClientProvider],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
