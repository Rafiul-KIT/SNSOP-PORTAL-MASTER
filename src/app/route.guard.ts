import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../environments/environment';
import { ApiService } from '../services/api.service';

export const routeGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const cookieService = inject(CookieService);
  const router = inject(Router);
  const apiService = inject(ApiService);

  const ACCESS_TOKEN = environment.cookie_name;
  const token = cookieService.get(ACCESS_TOKEN);

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

  const targetUrl = state.url.split('?')[0]; // Strip query parameters
  const menuCacheKey = `menus_${decoded.roleId}`;

  const normalizeUrl = (url: string): string => {
    const [path] = url.split(/[?#]/);
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return normalized.replace(/\/+$/, '') || '/';
  };

  const routeMatches = (menuUrl: string, url: string): boolean => {
    const urlSegments = normalizeUrl(url).split('/').filter(s => s.length > 0);
    const menuUrlSegments = normalizeUrl(menuUrl).split('/').filter((s: string) => s.length > 0);

    if (urlSegments.length !== menuUrlSegments.length) {
      return false;
    }

    return menuUrlSegments.every((segment: string, index: number) =>
      segment.startsWith(':') || segment === urlSegments[index]
    );
  };

  const getEquivalentUrls = (url: string): string[] => {
    const cleanUrl = normalizeUrl(url);

    const equivalents = new Set<string>([cleanUrl]);

    if (/^\/help-desk\/request-detail\/[^/]+$/.test(cleanUrl)) {
      equivalents.add('/help-desk/my-requests');
    }

    if (/^\/help-desk\/request-details\/[^/]+$/.test(cleanUrl)) {
      equivalents.add('/help-desk/support-management');
      equivalents.add('/help-desk/status-tracker');

    }

    if (cleanUrl === '/help-desk/setup') {
      equivalents.add('/help-desk/support-management');
    }

    return [...equivalents];
  };

  const dynamicRoutePrefixes = [
    '/beneficiary/details/',
    '/beneficiary/details-view/',
    '/beneficiary/edit/',
    '/beneficiary/migrate/',
    '/adjudication/',
    '/report/',
    '/restore/',
    '/pending-beneficiary/',
    '/beneficiary-approval/',
    '/beneficiary-audit/',
    '/beneficiary/momo-update/',
  ];

  const isDynamicRoute = (url: string): boolean => {
    const cleanUrl = normalizeUrl(url);
    return dynamicRoutePrefixes.some(prefix => cleanUrl.startsWith(prefix));
  };

  const hasAccess = (menus: any[], url: string): boolean => {
    const candidateUrls = getEquivalentUrls(url);

    for (const menu of menus) {
      if (!menu.url) continue;

      if (candidateUrls.some(candidateUrl => routeMatches(menu.url, candidateUrl))) {
        return true;
      }
    }

    if (isDynamicRoute(url)) {
      return true;
    }

    return false;
  };

  const readCachedMenus = (): any[] | null => {
    const menus = sessionStorage.getItem(menuCacheKey);
    if (!menus) return null;

    try {
      const parsed = JSON.parse(menus);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      sessionStorage.removeItem(menuCacheKey);
      return null;
    }
  };

  const fetchMenus = async (): Promise<any[] | null> => {
    try {
      const res = await apiService.GET<any>(`api/menus/role/${decoded.roleId}`, {}, 'alt');
      const menus = res?.data?.data;
      if (!Array.isArray(menus)) return null;

      sessionStorage.setItem(menuCacheKey, JSON.stringify(menus));
      return menus;
    } catch (error) {
      console.error('Failed to load permitted menus for route guard:', error);
      return null;
    }
  };

  const permittedMenus = readCachedMenus() ?? await fetchMenus();
  if (!permittedMenus) {
    return router.parseUrl('/unauthorized');
  }

  const allowed = hasAccess(permittedMenus, targetUrl);

  if (!allowed) {
    console.warn('Access denied for route:', targetUrl);
    return router.parseUrl('/unauthorized');
  }

  return true;
};
