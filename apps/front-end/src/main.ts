import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { bootstrapApplication } from '@angular/platform-browser';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { appConfig } from './app/app.config';
import { AuthService } from './app/services/auth.service';


@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class App {
  private auth = inject(AuthService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  hasUser = toSignal(this.auth.user$, { initialValue: null });
  currentLocale = $localize.locale ?? 'uk';

  logout(): void {
    this.auth.logout();
    this.router.navigate(['login'], {
      replaceUrl: false
    })
  }

  localizedPath(locale: 'uk' | 'en'): string {
    const { pathname, search, hash } = this.document.location;
    const routePath = pathname.replace(/^\/(uk|en)(?=\/|$)/, '') || '/';

    return `/${locale}${routePath}${search}${hash}`;
  }

  isLocale(locale: 'uk' | 'en'): boolean {
    return this.currentLocale.toLowerCase().startsWith(locale);
  }
}

bootstrapApplication(App, appConfig);
