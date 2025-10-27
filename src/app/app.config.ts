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
import { MessageService } from 'primeng/api';
import { AzureAdAuthService } from '../services/azure-ad-auth.service';
import axios from 'axios';


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
  cookieService: CookieService,
  messageService: MessageService,
  azureAdAuthService: AzureAdAuthService,
) {
  console.log('initMsal', authService);
  return async () => {
    try {
      // Handle MSAL redirect only once
      const redirectResponse = await authService
        .handleRedirectObservable()
        .toPromise(); // Use toPromise() for APP_INITIALIZER to wait

      if (redirectResponse) {
        authService.instance.setActiveAccount(redirectResponse.account);

        // Perform token exchange with backend
        try {
          const headers = new HttpHeaders({
            Authorization: `Bearer ${redirectResponse.idToken}`, // Use idToken from the redirect response
            'X-ENV': environment.env
          });

          const exchangeResponse: any = await http
            .get(`${environment.authBackend}/auth/exchange`, { headers })
            .toPromise(); // Convert to Promise for await

          console.log('/auth/exchange', exchangeResponse);
          if (exchangeResponse?.status === 'OK' && exchangeResponse?.data?.access_token) {
            const host = (() => {
              try { return new URL(environment.domain).hostname; }
              catch { return environment.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, ''); }
            })();
            cookieService.set(
              environment.cookie_name,
              exchangeResponse.data.access_token,
              undefined,
              '/',
              host,
              true,
              'Lax'
            );

            azureAdAuthService.updateLoginState(exchangeResponse.data.access_token);
            // Navigation will be handled by landing.ts effect or guard
            // router.navigate(['home']); // Removed direct navigation from here
          } else {
            messageService.add({
              severity: 'error',
              summary: 'Login Failed',
              detail: 'User not found'
            });
            router.navigate(['/landing']);
          }
        } catch (exchangeError) {
          console.error('Error exchanging token with backend:', exchangeError);
          messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: 'User not found'
          });
          router.navigate(['/landing']);
        }
      } else {
        // If no redirect response, check if already authenticated (e.g., page refresh)
        const activeAccount = authService.instance.getActiveAccount();
        if (activeAccount) {
          // If an active account exists, try to get the exchange token from cookie
          // This is handled by AzureAdAuthService.initializeFromCookie()
          // If initializeFromCookie() fails, it will clear the state.
          // No explicit action needed here, as initializeFromCookie() runs in AzureAdAuthService constructor.
        }
      }

      // Removed redundant MSAL broadcast service subscriptions and account checks here
      // These are already handled in AzureAdAuthService constructor.

    } catch (err) {
      console.error('MSAL initialization failed:', err);
      // If MSAL initialization fails, ensure user is on landing page
      router.navigate(['/landing']);
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
    MessageService,
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
        MessageService,
        AzureAdAuthService,
      ],
    },
  ],
};
