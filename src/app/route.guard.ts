/*
import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../environments/environment';

export const routeGuard: CanActivateChildFn = (route: any) => {
  const cookieService = inject(CookieService);
  const router = inject(Router);
  let lState: boolean = true;
  const ACCESS_TOKEN = environment.cookie_name;
  const isLoggedIn = cookieService.get(ACCESS_TOKEN) ? true : false;
  console.log('routeGuard', isLoggedIn);
  // console.log('routeGuard', route.routeConfig.path);
  if (!isLoggedIn) {
    lState = false;
    router.navigateByUrl('/login');
  }
  return lState;
};
*/


// src/app/route.guard.ts
import { inject } from '@angular/core';
import { CanActivateChildFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../environments/environment';
import axios from 'axios';
import { AzureAdAuthService } from '../services/azure-ad-auth.service';

export const routeGuard: CanActivateChildFn = async (childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const cookieService = inject(CookieService);
  const authService = inject(AzureAdAuthService);

  const token = cookieService.get(environment.cookie_name);
  if (!token) {
    router.navigateByUrl('/landing');
    return false;
  }

  let decoded: any;
  try {
    decoded = jwtDecode(token);
  } catch {
    router.navigateByUrl('/landing');
    return false;
  }

  // Check expiry
  if (decoded.exp && Date.now() >= decoded.exp * 1000) {
    router.navigateByUrl('/landing');
    return false;
  }

  // Define routes that are always allowed for authenticated users
  const alwaysAllowedPaths = ['portals', 'profile'];
  const childPath = childRoute.routeConfig?.path || '';

  if (alwaysAllowedPaths.includes(childPath)) {
    return true; // Allow access to common pages
  }

  // If menus not yet loaded, fetch them
  let menus = authService.getMenus();
  if (!menus || menus.length === 0) {
    try {
      const resp = await axios.get(`${environment.authBackend}/api/menus/role/${decoded.roleId}`);
      menus = resp.data?.data || [];
      const current = authService.loginState();
      authService.loginState.set({ ...current, menus });
    } catch (err) {
      console.error('Failed to fetch menus in guard:', err);
      router.navigateByUrl('/unauthorized');
      return false;
    }
  }

  // Check if the target URL is in the user's permitted menus
  const targetUrl = state.url;
  const urlToCheck = targetUrl.startsWith('/') ? targetUrl.substring(1) : targetUrl;

  const allowed = menus.some((menu: any) => menu.url === urlToCheck);

  if (!allowed) {
    console.warn('Access denied for route:', targetUrl);
    router.navigateByUrl('/unauthorized');
    return false;
  }

  return true;
};



