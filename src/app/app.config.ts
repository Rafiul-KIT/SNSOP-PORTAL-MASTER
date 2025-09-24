// src/app/app.config.ts
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter, Router, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { CookieService } from 'ngx-cookie-service';

import {
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  MsalInterceptor,
} from '@azure/msal-angular';
import {
  PublicClientApplication,
  BrowserCacheLocation,
  InteractionType,
  InteractionStatus,
  EventMessage,
  EventType,
  AuthenticationResult,
} from '@azure/msal-browser';
import { filter } from 'rxjs/operators';

import { environment } from '../environments/environment';


// ---------- MSAL factories (use environment.msalConfig) ----------
function msalInstanceFactory() {
  const cfg = environment.msalConfig;
  const cacheLocation =
    cfg.cache?.cacheLocation === 'localStorage'
      ? BrowserCacheLocation.LocalStorage
      : BrowserCacheLocation.SessionStorage;

  return new PublicClientApplication({
    auth: {
      clientId: cfg.auth.clientId,
      authority: cfg.auth.authority,
      redirectUri: cfg.auth.redirectUri,
      postLogoutRedirectUri: cfg.auth.postLogoutRedirectUri,
    },
    cache: {
      cacheLocation,
      storeAuthStateInCookie: !!cfg.cache?.storeAuthStateInCookie,
    },
  });
}

function msalGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: { scopes: ['user.read'] },
  };
}

function msalInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, string[]>();
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/', ['user.read']);
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

// ---------- Bootstrap initializer: MSAL redirect + token exchange (no ApiService) ----------
function initMsal(
  authService: MsalService,
  msalBroadcastService: MsalBroadcastService,
  http: HttpClient,
  router: Router,
  cookieService: CookieService
) {
  console.log('initMsal', authService);
  return async () => {
    try {
      // Step 1: Wait for MSAL initialization to complete and handle the redirect
      const redirectResponse = await authService
        .handleRedirectObservable()
        .toPromise();
      if (redirectResponse) {
        // If redirect response is available, set the active account
        authService.instance.setActiveAccount(redirectResponse.account);
      }

      // Step 2: Check if an active account exists and set it
      const checkAccount = () => {
        const _loggedIn = !!authService.instance.getActiveAccount();
      };

      const checkAndSetActiveAccount = () => {
        let active = authService.instance.getActiveAccount();
        if (!active) {
          const accounts = authService.instance.getAllAccounts();
          if (accounts.length > 0) {
            authService.instance.setActiveAccount(accounts[0]);
            active = authService.instance.getActiveAccount();
          }
        }
        checkAccount();
      };

      // Step 3: Subscribe to MSAL broadcast service once initialization is done
      msalBroadcastService.inProgress$
        .pipe(filter((s: InteractionStatus) => s === InteractionStatus.None))
        .subscribe(() => {
          checkAccount();
          checkAndSetActiveAccount();
        });

      msalBroadcastService.msalSubject$
        .pipe(
          filter(
            (msg: EventMessage) =>
              msg.eventType === EventType.LOGIN_SUCCESS ||
              msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
          )
        )
        .subscribe((msg: EventMessage) => {
          const payload = msg.payload as AuthenticationResult;
          authService.instance.setActiveAccount(payload.account);
          // Optionally stash the payload.idToken for later
        });

      // Step 4: Handle redirect and exchange ID token with backend
      const response = await authService.handleRedirectObservable().toPromise();
      console.log('authService.handleRedirectObservable() response', response);
      if (response) {
        authService.instance.setActiveAccount(response.account);
        checkAccount();

        const headers = new HttpHeaders({
          Authorization: `Bearer ${response.idToken}`,
          'X-ENV': environment.env

        });

        http
          .get(`${environment.authBackend}/auth/exchange`, { headers })
          .subscribe({
            next: (r: any) => {
              console.log('/auth/exchange', r);
              if (r?.status === 'OK' && r?.data?.access_token) {
                // derive bare hostname from environment.domain
                const host = (() => {
                  try { return new URL(environment.domain).hostname; }
                  catch { return environment.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, ''); }
                })();

                // If you want a session cookie (clears on browser close):
                cookieService.set(
                  environment.cookie_name,          // 'mis_ta'
                  r.data.access_token,              // token from backend
                  undefined,                        // no expires => session cookie
                  '/',                              // path
                  host,                             // domain WITHOUT protocol
                  true,                             // secure (required on HTTPS)
                  'Lax'                             // sameSite ('None' if used inside iframes/cross-site)
                );

                // If you *do* want a fixed lifetime instead (e.g., 1 day):
                // cookieService.set(environment.cookie_name, r.data.access_token, 1, '/', host, true, 'Lax');

                router.navigate(['home']);
              } else {
                router.navigate(['landing']);
              }
            },
            error: () => router.navigate(['landing']),
          });
      }

      checkAndSetActiveAccount();
    } catch (err) {
      console.error('MSAL initialization failed:', err);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    provideNoopAnimations(),
    CookieService,
    // Enable DI-based interceptors (MsalInterceptor)
    provideHttpClient(withInterceptorsFromDi()),
    providePrimeNG({
      theme: { preset: Aura },
      zIndex: { modal: 1100, overlay: 1000, menu: 1000, tooltip: 1100 },
    }),
    { provide: MSAL_INSTANCE, useFactory: msalInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: msalGuardConfigFactory },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: msalInterceptorConfigFactory,
    },
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initMsal,
      deps: [
        MsalService,
        MsalBroadcastService,
        HttpClient,
        Router,
        CookieService,
      ],
    },
  ],
};
