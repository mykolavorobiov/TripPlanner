import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { TripStore } from './components/trips/trip.state';
import { CustomDateAdapter } from './services/date-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideNativeDateAdapter(),
    {
      provide: MAT_DATE_LOCALE,
      useFactory: (locale: string) => locale,
      deps: [LOCALE_ID],
    },
    { provide: DateAdapter, useClass: CustomDateAdapter },
    TripStore,
  ],
};
