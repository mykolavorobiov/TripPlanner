import { Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { SUPABASE_CLIENT } from './supabase.constants';

export const supabaseClientProvider = {
  provide: SUPABASE_CLIENT,
  scope: Scope.REQUEST,
  inject: [ConfigService, REQUEST],
  useFactory: (config: ConfigService, request: Request): SupabaseClient => {
    const authorization = request.headers.authorization;
    return createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY'),
      {
        global: authorization
          ? { headers: { Authorization: authorization } }
          : undefined,
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );
  },
};
