import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';

const refreshCookie = 'trip_planner_refresh_token';
const refreshPath = '/api/auth/refresh';

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService) {}

  readRefreshToken(request: Request): string | undefined {
    const cookies = request.headers.cookie?.split(';') ?? [];
    for (const cookie of cookies) {
      const [name, ...value] = cookie.trim().split('=');
      if (name === refreshCookie) return decodeURIComponent(value.join('='));
    }
    return undefined;
  }

  setRefreshToken(response: Response, token: string): void {
    response.cookie(refreshCookie, token, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: this.sameSite,
      path: refreshPath,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  clearRefreshToken(response: Response): void {
    response.clearCookie(refreshCookie, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: this.sameSite,
      path: refreshPath,
    });
  }

  private get sameSite(): CookieOptions['sameSite'] {
    return this.config.get('COOKIE_SAME_SITE') === 'none' ? 'none' : 'strict';
  }
}
