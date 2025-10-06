import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { Home } from './pages/home/home';
import { Profile } from './pages/profile/profile';
import { Landing } from './pages/landing/landing';
import { routeGuard } from './route.guard';
import { authGuard } from './auth.guard';
import {Users} from './pages/user-management/users/users';
import {Role} from './pages/user-management/role/role';
import {Register} from './pages/user-management/register/register';

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
  { path: 'users',
    component: Users,
    canActivate: [routeGuard],
  },
  { path: 'roles',
    component: Role,
    canActivate: [routeGuard],
  },
  { path: 'register',
    component: Register,
    canActivate: [routeGuard],
  },
  {
    path: '**',
    component: NotFound,
  },
];
