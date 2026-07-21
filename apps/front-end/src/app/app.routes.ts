import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard],
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/main-list/main-list').then((m) => m.MainList),
    canActivate: [authGuard],
  },
  {
    path: 'map',
    loadComponent: () => import('./components/map-view/map-view').then((m) => m.MapView),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
];
