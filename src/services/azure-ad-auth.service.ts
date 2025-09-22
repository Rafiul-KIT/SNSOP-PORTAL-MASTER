// src/app/core/services/azure-ad-auth.service.ts
import { Injectable } from '@angular/core';
import {
  MsalService,
  MsalBroadcastService,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
} from '@azure/msal-angular';
import { InteractionStatus, RedirectRequest } from '@azure/msal-browser';
import { BehaviorSubject, Observable, filter, takeUntil } from 'rxjs';
import { environment } from '../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class AzureAdAuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private msalService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private cookieService: CookieService
  ) {
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

  /*logout(): void {
    this.msalService.logoutRedirect();
  }*/

  logout(): void {
    // Clear authentication-related cookies
    // document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';  // Clear token cookie
    // document.cookie = 'tokenExpiry=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';  // Clear expiry cookie
    // document.cookie = 'mis_ta=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';  // Clear any session cookie (e.g., mis_ta)
    // Perform MSAL logout (to end the user's session in MSAL)
    // Redirect to the login page of the master portal
    // window.location.href = `${environment.portals.master}/landing`;  // Update the login page path if needed
    this.msalService.logoutRedirect();
    this.cookieService.deleteAll('/', environment.domain, false);
    this.isAuthenticatedSubject.next(false);
    window.location.href = `${environment.portals.master}`;
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
    const token: string | null = localStorage.getItem('mis_ta');
    if (token != null) {
      return jwtDecode(token);
    } else {
      return null;
    }
  }
}
