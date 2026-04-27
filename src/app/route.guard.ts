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

  const menuHasModuleAccess = (menus: any[], moduleUrl: string, moduleNames: string[]): boolean => {
    const baseUrl = normalizeUrl(moduleUrl);
    const normalizeName = (name: string): string =>
      name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
    const compactName = (name: string): string => normalizeName(name).replace(/\s+/g, '');
    const normalizedModuleNames = moduleNames.map(name => normalizeName(name));
    const compactModuleNames = moduleNames.map(name => compactName(name));
    const matchesModuleName = (name: string): boolean => {
      const normalizedName = normalizeName(name);
      const compactedName = compactName(name);

      return normalizedModuleNames.some(moduleName =>
        normalizedName === moduleName ||
        normalizedName.startsWith(`${moduleName} `) ||
        normalizedName.includes(moduleName)
      ) || compactModuleNames.some(moduleName => compactedName.includes(moduleName));
    };

    return menus.some((menu) => {
      const menuUrl = typeof menu.url === 'string' ? normalizeUrl(menu.url) : '';
      const menuName = typeof menu.name === 'string' ? menu.name : '';
      const parentName = typeof menu.parentMenu?.name === 'string' ? menu.parentMenu.name : '';
      const parentUrl = typeof menu.parentMenu?.url === 'string' ? normalizeUrl(menu.parentMenu.url) : '';

      return (
        matchesModuleName(menuName) ||
        matchesModuleName(parentName) ||
        menuUrl === baseUrl ||
        menuUrl.startsWith(`${baseUrl}/`) ||
        parentUrl === baseUrl ||
        parentUrl.startsWith(`${baseUrl}/`)
      );
    });
  };

  const hasAccess = (menus: any[], url: string): boolean => {
    const cleanUrl = normalizeUrl(url);

    for (const menu of menus) {
      if (!menu.url) continue;

      // Check for exact match or parameterized match.
      if (routeMatches(menu.url, cleanUrl)) {
        return true;
      }
    }

    const moduleAccessRules = [
      {
        urls: ['/cto-dashboard', '/survey-cto-export', '/survey-cto-import', '/survey-cto-report'],
        names: ['Survey CTO', 'SurveyCTO'],
      },
      {
        urls: ['/help-desk'],
        names: ['Help Desk'],
      },
      {
        urls: ['/monitoring-evaluation'],
        names: ['Monitoring & Evaluation', 'Monitoring and Evaluation'],
      },
      {
        urls: ['/economic-opportunities'],
        names: ['Economic Opportunities'],
      },
    ];

    for (const rule of moduleAccessRules) {
      for (const ruleUrl of rule.urls) {
        const moduleUrl = normalizeUrl(ruleUrl);
        if (
          (cleanUrl === moduleUrl || cleanUrl.startsWith(`${moduleUrl}/`)) &&
          menuHasModuleAccess(menus, moduleUrl, rule.names)
        ) {
          return true;
        }
      }
    }

    const authenticatedPortalRoutes = [
      '/cto-dashboard',
      '/survey-cto-export',
      '/survey-cto-import',
      '/survey-cto-report',
      '/help-desk',
      '/monitoring-evaluation',
      '/economic-opportunities',
    ];

    for (const portalRoute of authenticatedPortalRoutes) {
      const moduleUrl = normalizeUrl(portalRoute);
      if (cleanUrl === moduleUrl || cleanUrl.startsWith(`${moduleUrl}/`)) {
        return true;
      }
    }

    // If the route is not found in the menu, allow access to known dynamic paths like:
    //  - /beneficiary/details/:id
    //  - /beneficiary/edit/:applicationId
    //  - Any other parameterized route you want to allow
    const dynamicRoutePrefixes = [
    
      '/help-desk/',
      '/help-desk/support-management',
      '/help-desk/support-management/',
    ];

    // Check if the route starts with any of the dynamic prefixes
    for (const prefix of dynamicRoutePrefixes) {
      if (cleanUrl.startsWith(prefix)) {
        return true; // Allow access to dynamic routes
      }
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
