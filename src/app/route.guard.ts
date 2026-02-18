import { inject } from '@angular/core';
import {
  CanActivateChildFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../environments/environment';
import axios from 'axios';
import { AzureAdAuthService } from '../services/azure-ad-auth.service';

export const routeGuard: CanActivateChildFn = async (
  childRoute: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const cookieService = inject(CookieService);
  const authService = inject(AzureAdAuthService);
  const apiService = inject(AzureAdAuthService);

  const token = cookieService.get(environment.cookie_name);
  // Check if the user is logged in
  if (!token) {
    const redirectUrl = `${environment.portals.master}/#/landing`;
    window.location.href = redirectUrl;
    return false;
  }

  // Decode the JWT token
  let decoded: any;
  try {
    decoded = jwtDecode(token);
  } catch {
    apiService.logout();
    return false;
  }

  // Check if the token is expired
  if (decoded.exp && Date.now() >= decoded.exp * 1000) {
    apiService.logout();
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
      const resp = await axios.get(
        `${environment.authBackend}/api/menus/role/${decoded.roleId}`
      );
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

  // Strip query parameters from the URL (ignore the query part)
  const urlToCheck = targetUrl.split('?')[0].startsWith('/')
    ? targetUrl.split('?')[0].substring(1)
    : targetUrl.split('?')[0]; // Strip query parameters and ensure no leading slashes

  const allowed = menus.some((menu: any) => menu.url === urlToCheck);

  if (!allowed) {
    console.warn('Access denied for route:', targetUrl);
    router.navigateByUrl('/unauthorized');
    return false;
  }

  return true;
};
