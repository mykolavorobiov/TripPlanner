import { BadRequestException, Injectable } from '@nestjs/common';
import type { ResolvedMapLink } from './resolved-map-link';

@Injectable()
export class MapLinksService {
  async resolve(value: string): Promise<ResolvedMapLink> {
    const originalUrl = value.trim();
    const parsed = this.parseGoogleUrl(originalUrl);

    let finalUrl = parsed.toString();
    try {
      const response = await fetch(finalUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
      });
      finalUrl = response.url || finalUrl;
    } catch {
      throw new BadRequestException('Could not resolve the Google Maps URL');
    }

    const coordinates = this.extractCoordinates(finalUrl);
    return {
      originalUrl,
      finalUrl,
      lat: coordinates?.lat ?? null,
      lng: coordinates?.lng ?? null,
    };
  }

  private parseGoogleUrl(value: string): URL {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new BadRequestException('A valid URL is required');
    }

    const host = url.hostname.toLowerCase();
    const allowed =
      host === 'maps.app.goo.gl' ||
      host === 'goo.gl' ||
      host === 'google.com' ||
      host.endsWith('.google.com');
    if (!allowed || url.protocol !== 'https:') {
      throw new BadRequestException('Only HTTPS Google Maps URLs are supported');
    }
    return url;
  }

  private extractCoordinates(value: string) {
    const pathMatch = value.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (pathMatch) return { lat: Number(pathMatch[1]), lng: Number(pathMatch[2]) };

    const url = new URL(value);
    const query = url.searchParams.get('q') ?? url.searchParams.get('query');
    const queryMatch = query?.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
    return queryMatch
      ? { lat: Number(queryMatch[1]), lng: Number(queryMatch[2]) }
      : null;
  }
}
