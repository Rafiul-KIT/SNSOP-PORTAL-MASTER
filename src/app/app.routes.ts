import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { Home } from './pages/home/home';
import { Profile } from './pages/profile/profile';
import { Landing } from './pages/landing/landing';
import { routeGuard } from './route.guard';
import { authGuard } from './auth.guard';
import { UserManagement } from './pages/user-management/user-management';

export const routes: Routes = [
  {
    path: 'landing',
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
  { path: 'user-management',
    component: UserManagement,
    canActivate: [routeGuard],
  },
  {
    path: '**',
    component: NotFound,
  },
];
