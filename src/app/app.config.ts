// src/app/app.config.ts
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, HttpClient, HttpHeaders } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

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

import { environment } from '../environments/environment.development';

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
  router: Router
) {
  return () => {
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
        // If you want, stash payload.idToken for later here.
      });

    // Handle redirect and exchange ID token with your backend
    authService.handleRedirectObservable().subscribe({
      next: (res) => {
        if (res) {
          authService.instance.setActiveAccount(res.account);
          checkAccount();

          const headers = new HttpHeaders({
            Authorization: `Bearer ${res.idToken}`, // backend expects ID token
          });

          http.get(`${environment.authBackend}/auth/exchange`, { headers }).subscribe({
            next: (r: any) => {
              if (r?.status === 'OK' || r?.data?.access_token) {
                localStorage.setItem('mis_ta', r.data.access_token);
                router.navigate(['dashboard']);
              } else {
                router.navigate(['dashboard']);
              }
            },
            error: () => router.navigate(['**']),
          });
        }
      },
      error: (err) => console.error(err),
    });

    checkAndSetActiveAccount();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideNoopAnimations(),

    // Enable DI-based interceptors (MsalInterceptor)
    provideHttpClient(withInterceptorsFromDi()),

    providePrimeNG({
      theme: { preset: Aura },
      zIndex: { modal: 1100, overlay: 1000, menu: 1000, tooltip: 1100 },
    }),

    { provide: MSAL_INSTANCE, useFactory: msalInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: msalGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: msalInterceptorConfigFactory },
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    MsalService,
    MsalGuard,
    MsalBroadcastService,

    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initMsal,
      deps: [MsalService, MsalBroadcastService, HttpClient, Router],
    },
  ],
};
