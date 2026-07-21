import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Request, Response } from 'express';
import { SUPABASE_CLIENT } from '../supabase/supabase.constants';
import type { AuthenticatedRequest } from './authenticated-request';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { AuthCookieService } from './auth-cookie.service';
import { publicSession } from './auth-response';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthCredentialsDto, OAuthSessionDto } from './auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Post('sign-up')
  @ApiOperation({ summary: 'Register with email and password' })
  async signUp(
    @Body() body: AuthCredentialsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { data, error } = await this.supabase.auth.signUp({
      email: body.email.trim(),
      password: body.password,
      options: { emailRedirectTo: `${this.frontendOrigin}/list` },
    });
    if (error) throw error;
    if (data.session)
      this.cookies.setRefreshToken(response, data.session.refresh_token);
    return { user: data.user, session: publicSession(data.session) };
  }

  @Post('sign-in')
  @ApiOperation({ summary: 'Sign in and set the refresh-token cookie' })
  async signIn(
    @Body() body: AuthCredentialsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: body.email.trim(),
      password: body.password,
    });
    if (error) throw error;
    this.cookies.setRefreshToken(response, data.session.refresh_token);
    return { user: data.user, session: publicSession(data.session) };
  }

  @Post('refresh')
  @ApiCookieAuth('refresh-token')
  @ApiOperation({
    summary: 'Rotate the refresh cookie and return a new access session',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.cookies.readRefreshToken(request);
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error) throw error;
    if (!data.session) throw new UnauthorizedException('Invalid refresh token');
    this.cookies.setRefreshToken(response, data.session.refresh_token);
    return { user: data.user, session: publicSession(data.session) };
  }

  @Post('session')
  @ApiOperation({
    summary: 'Exchange an OAuth browser session for a refresh cookie',
  })
  async createSession(
    @Body() body: OAuthSessionDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { data, error } = await this.supabase.auth.getUser(body.accessToken);
    if (error || !data.user)
      throw new UnauthorizedException('Invalid OAuth session');
    this.cookies.setRefreshToken(response, body.refreshToken);
    return {
      session: {
        access_token: body.accessToken,
        expires_at: body.expiresAt,
        user: data.user,
      },
    };
  }

  @Get('google')
  @ApiOperation({ summary: 'Create a Google OAuth authorization URL' })
  async google() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${this.frontendOrigin}/list`,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    return data;
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Return the authenticated user' })
  @UseGuards(SupabaseAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  @Post('sign-out')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Revoke the current session and clear its refresh cookie',
  })
  @UseGuards(SupabaseAuthGuard)
  async signOut(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const revokeResponse = await fetch(
      `${this.config.getOrThrow<string>('SUPABASE_URL')}/auth/v1/logout`,
      {
        method: 'POST',
        headers: {
          apikey: this.config.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY'),
          Authorization: `Bearer ${request.accessToken}`,
        },
      },
    );
    this.cookies.clearRefreshToken(response);
    if (!revokeResponse.ok)
      throw new Error('Could not revoke the Supabase session');
    return { success: true };
  }

  private get frontendOrigin(): string {
    return this.config.get('FRONTEND_ORIGIN', 'http://localhost:4200');
  }
}
