import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.constants';
import type { AuthenticatedRequest } from './authenticated-request';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {}

  @Post('sign-up')
  async signUp(@Body() body: { email: string; password: string }) {
    const { data, error } = await this.supabase.auth.signUp({
      email: body.email.trim(),
      password: body.password,
      options: { emailRedirectTo: `${this.frontendOrigin}/list` },
    });
    if (error) throw error;
    return data;
  }

  @Post('sign-in')
  async signIn(@Body() body: { email: string; password: string }) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: body.email.trim(),
      password: body.password,
    });
    if (error) throw error;
    return data;
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: body.refreshToken,
    });
    if (error) throw error;
    return data;
  }

  @Get('google')
  async google() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${this.frontendOrigin}/list`, skipBrowserRedirect: true },
    });
    if (error) throw error;
    return data;
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  @Post('sign-out')
  @UseGuards(SupabaseAuthGuard)
  async signOut(@Req() request: AuthenticatedRequest) {
    const response = await fetch(
      `${this.config.getOrThrow<string>('SUPABASE_URL')}/auth/v1/logout`,
      {
        method: 'POST',
        headers: {
          apikey: this.config.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY'),
          Authorization: `Bearer ${request.accessToken}`,
        },
      },
    );
    if (!response.ok) throw new Error('Could not revoke the Supabase session');
    return { success: true };
  }

  private get frontendOrigin(): string {
    return this.config.get('FRONTEND_ORIGIN', 'http://localhost:4200');
  }
}
