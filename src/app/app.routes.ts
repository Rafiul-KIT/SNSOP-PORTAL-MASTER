import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { Home } from './pages/home/home';
import { Profile } from './pages/profile/profile';
import { Landing } from './pages/landing/landing';
import { routeGuard } from './route.guard';
import { authGuard } from './auth.guard';
import { Users } from './pages/user-management/users/users';
import { Register } from './pages/user-management/register/register';
import { Role } from './pages/user-management/role/role';
import { RoleLink } from './pages/user-management/role-link/role-link';
import { AddNewRole } from './pages/user-management/add-new-role/add-new-role';
import { Unauthorized } from './components/unauthorized/unauthorized';
import { UnderConstruction } from './pages/under-construction/under-construction';
import { SurveyCto } from './pages/survey-cto/survey-cto/survey-cto';



export const routes: Routes = [
  {
    path: 'landing',
    component: Landing,
  },
  {
    path: 'home',
    component: Home,
    canActivateChild: [routeGuard],
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
    path: 'user-management',
    canActivate: [routeGuard],
    children: [
      { path: 'users', component: Users, canActivate: [routeGuard], },
      { path: 'register', component: Register, canActivate: [routeGuard], },
      { path: 'roles', component: Role, canActivate: [routeGuard], },
      { path: 'role-link', component: RoleLink },
      { path: 'add-new-role', component: AddNewRole },
      { path: '', redirectTo: 'users', pathMatch: 'full' }
    ],
  },
  { path: 'survey-cto', 
    component: SurveyCto 
  },
  { path: 'unauthorized', component: Unauthorized },
  { path: 'under-construction', component: UnderConstruction },
  {
    path: '**',
    component: NotFound,
  },
];
