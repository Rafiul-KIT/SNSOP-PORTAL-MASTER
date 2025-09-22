import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../environments/environment';

export const authGuard: CanActivateFn = (route: any) => {
  const cookieService = inject(CookieService);
  const router = inject(Router);
  let lState: boolean = true;
  const ACCESS_TOKEN = environment.cookie_name;
  const isLoggedIn = cookieService.get(ACCESS_TOKEN) ? true : false;
  // console.log('authGuard', isLoggedIn);
  // console.log('authGuard', route.routeConfig.path);
  if (isLoggedIn) {
    lState = false;
    router.navigateByUrl('/home');
  }
  return lState;
};
