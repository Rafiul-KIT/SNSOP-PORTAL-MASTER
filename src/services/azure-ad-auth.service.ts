// src/app/core/services/azure-ad-auth.service.ts
import { Injectable, signal } from '@angular/core';
import {
  MsalService,
  MsalBroadcastService,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
} from '@azure/msal-angular';
import { InteractionStatus, RedirectRequest } from '@azure/msal-browser';
import { BehaviorSubject, Observable, filter, take, takeUntil } from 'rxjs';
import { environment } from '../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AzureAdAuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public ACCESS_TOKEN = environment.cookie_name;
  public loginState = signal({
    token: null as string | null,
    user: null as any | null, 
  });

  constructor(
    private msalService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private cookieService: CookieService,
    private router: Router
  ) {
    const accessToken: any = this.cookieService.get(this.ACCESS_TOKEN);
    if (accessToken) {
      try {
        const userData: any = jwtDecode(accessToken);
        this.loginState.set({
          token: accessToken,
          user: userData,
        });
      } catch (error) {
        console.error('Failed to decode token from cookie:', error);
        const host = (() => {
          try {
            return new URL(environment.domain).hostname;
          } catch {
            // Robust fallback for various domain formats
            const domain = environment.domain.replace(/^https?:\/\//, ''); // remove protocol
            const hostOnly = domain.split('/')[0].split(':')[0]; // remove path and port
            return hostOnly;
          }
        })();
        this.cookieService.delete(this.ACCESS_TOKEN, '/', host, true, 'Lax');
      }
    }
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None)
      )
      .subscribe(() => {
        this.checkAndSetActiveAccount();
      });
    window.addEventListener('message', (event: MessageEvent) => {
      // Ensure the message is coming from the Child Portal
      if (event.data === 'logout') {
        this.logout(); // Trigger logout when 'logout' message is received
      }
    });
    // Or, use localStorage approach (alternative to postMessage)
    window.addEventListener('storage', () => {
      if (localStorage.getItem('isLoggedOut') === 'true') {
        this.logout(); // Trigger logout when 'isLoggedOut' flag is set in localStorage
      }
    });
  }

  private checkAndSetActiveAccount(): void {
    const activeAccount = this.msalService.instance.getActiveAccount();
    if (
      !activeAccount &&
      this.msalService.instance.getAllAccounts().length > 0
    ) {
      const accounts = this.msalService.instance.getAllAccounts();
      this.msalService.instance.setActiveAccount(accounts[0]);
    }
    this.isAuthenticatedSubject.next(!!activeAccount);
  }

  login(): void {
    const loginRequest: RedirectRequest = {
      scopes: ['user.read'],
    };
    this.msalService.loginRedirect(loginRequest);
  }

  public updateLoginState(accessToken: string): void {
    if (accessToken) {
      try {
        const userData: any = jwtDecode(accessToken);
        this.loginState.set({
          token: accessToken,
          user: userData,
        });
      } catch (error) {
        console.error('Failed to decode token:', error);
        this.loginState.set({ token: null, user: null });
      }
    }
  }

  logout(): void {
    const host = (() => {
      try {
        return new URL(environment.domain).hostname;
      } catch {
        return environment.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      }
    })();
    this.cookieService.delete(this.ACCESS_TOKEN, '/', host, true, 'Lax');

    this.isAuthenticatedSubject.next(false);
    this.loginState.set({ token: null, user: null });

    this.msalService.logoutRedirect();
  }

  isAuthenticated(): boolean {
    return this.msalService.instance.getActiveAccount() !== null;
  }

  getAccessToken(): Observable<string> {
    return new Observable<string>((observer) => {
      this.msalService
        .acquireTokenSilent({
          scopes: ['user.read'],
        })
        .subscribe({
          next: (response) => {
            observer.next(response.accessToken);
            observer.complete();
          },
          error: (error) => {
            observer.error(error);
          },
        });
    });
  }

  getUser(): any {
    return this.msalService.instance.getActiveAccount();
  }

  getExchangeTokenInfo() {
    const token: any = localStorage.getItem(this.ACCESS_TOKEN);
    if (token != null) {
      return jwtDecode(token);
    } else {
      return null;
    }
  }
}
