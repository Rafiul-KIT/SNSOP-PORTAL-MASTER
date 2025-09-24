import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { Home } from './pages/home/home';
import { Profile } from './pages/profile/profile';
import { Landing } from './pages/landing/landing';
import { routeGuard } from './route.guard';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'landing',
    canActivate: [authGuard],
    component: Landing,
  },
  {
    path: 'home',
    component: Home,
    canActivate: [routeGuard],
    children: [
      {
        path: 'portals',
        component: Dashboard,
      },
      {
        path: 'profile',
        component: Profile,
      },
      { path: '', pathMatch: 'full', redirectTo: 'portals' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'landing' },
  {
    path: '**',
    component: NotFound,
  },
];
