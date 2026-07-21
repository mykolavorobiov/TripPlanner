import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { SUPABASE_CLIENT } from '../supabase/supabase.constants';
import type { AuthenticatedRequest } from './authenticated-request';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const accessToken = authorization.slice(7);
    const { data, error } = await this.supabase.auth.getUser(accessToken);
    if (error || !data.user) throw new UnauthorizedException('Invalid session');

    const authenticated = request as AuthenticatedRequest;
    authenticated.user = data.user;
    authenticated.accessToken = accessToken;
    return true;
  }
}
