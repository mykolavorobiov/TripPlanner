import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type { ResolvedMapLink } from '../models/resolved-map-link';

@Injectable({ providedIn: 'root' })
export class MapLinkService {
  private readonly http = inject(HttpClient);

  resolveGoogleMapsLink(url: string): Promise<ResolvedMapLink> {
    return firstValueFrom(
      this.http.post<ResolvedMapLink>(`${environment.apiUrl}/map-links/resolve`, { url }),
    );
  }

  isGoogleMapsUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      return (
        host === 'maps.app.goo.gl' ||
        host.endsWith('.google.com') ||
        host === 'google.com' ||
        host === 'goo.gl'
      );
    } catch {
      return false;
    }
  }

  buildCanonicalMapLink(lat: number, lng: number): string {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
}
