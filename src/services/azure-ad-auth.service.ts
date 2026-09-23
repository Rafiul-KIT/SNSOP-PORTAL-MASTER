// src/app/core/services/azure-ad-auth.service.ts
import { Injectable, signal } from '@angular/core';
import {
  MsalService,
  MsalBroadcastService,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
} from '@azure/msal-angular';
import { InteractionStatus, RedirectRequest } from '@azure/msal-browser';
import { BehaviorSubject, Observable, filter } from 'rxjs';
import { environment } from '../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import axios from 'axios';

@Injectable({
  providedIn: 'root',
})
export class AzureAdAuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public ACCESS_TOKEN = environment.cookie_name;

  public loginState = signal<{
    token: string | null;
    user: any | null;
    menus: any[] | null;
  }>({
    token: null,
    user: null,
    menus: null,
  });

  constructor(
    private msalService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private cookieService: CookieService,
    private router: Router
  ) {
    this.initializeFromCookie();
    this.msalBroadcastService.inProgress$
      .pipe(filter((status: InteractionStatus) => status === InteractionStatus.None))
      .subscribe(() => {
        this.checkAndSetActiveAccount();
      });

    window.addEventListener('message', (event: MessageEvent) => {
      // Ensure the message is coming from the Child Portal
      if (event.data === 'logout') {
        this.logout(); // Trigger logout when 'logout' message is received
      }
    });

    window.addEventListener('storage', () => {
      if (localStorage.getItem('isLoggedOut') === 'true') {
        this.logout(); // Trigger logout when 'isLoggedOut' flag is set in localStorage
      }
    });
  }

  private async initializeFromCookie() {
    const token = this.cookieService.get(this.ACCESS_TOKEN);
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        console.log('Decoded token:', decoded);
        this.loginState.set({
          token,
          user: decoded,
          menus: null,
        });
        await this.fetchMenusByRole(decoded.roleId);
      } catch (err) {
        console.error('Failed to decode token:', err);
        this.clearState();
      }
    }
  }

  private async fetchMenusByRole(roleId: number) {
    try {
      // Check cache first
      const cached = sessionStorage.getItem(`menus_${roleId}`);
      if (cached) {
        const menus = JSON.parse(cached);
        console.log('Loaded permitted menus from cache');
        const current = this.loginState();
        this.loginState.set({ ...current, menus });
        return;
      }

      // If not cached, fetch from API
      const token = this.cookieService.get(this.ACCESS_TOKEN) || this.loginState().token;
      const resp = await axios.get(`${environment.authBackend}/api/menus/role/${roleId}`, token ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } : undefined);
      const menus = resp.data?.data || [];

      // Store in sessionStorage
      sessionStorage.setItem(`menus_${roleId}`, JSON.stringify(menus));

      const current = this.loginState();
      this.loginState.set({ ...current, menus });
      console.log('Fetched permitted menus from API');
    } catch (err) {
      console.error('Failed to fetch menus for role:', err);
    }
  }

  private checkAndSetActiveAccount(): void {
    const activeAccount = this.msalService.instance.getActiveAccount();
    if (!activeAccount && this.msalService.instance.getAllAccounts().length > 0) {
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
          menus: null, // Set this to null or any valid menu data if available
        });
        if (userData?.roleId) {
          void this.fetchMenusByRole(userData.roleId);
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
        this.loginState.set({ token: null, user: null, menus: null });
      }
    }
  }

  logout(): void {
    const host = window.location.hostname;
    this.cookieService.delete(this.ACCESS_TOKEN, '/', host, true, 'Lax');

    sessionStorage.clear();
    this.isAuthenticatedSubject.next(false);
    this.loginState.set({ token: null, user: null , menus: null });

    this.msalService.logoutRedirect();
  }

  private clearState() {
    this.loginState.set({ token: null, user: null, menus: null });
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

  public getUserRoleId(): number | null {
    const user = this.loginState().user;
    return user?.roleId || null;
  }

  public getMenus(): any[] {
    return this.loginState().menus || [];
  }

  public setExchangeTokenCookie(token: string): void {
    const host = window.location.hostname;
    this.cookieService.set(this.ACCESS_TOKEN, token, undefined, '/', host, true, 'Lax');
  }

  public getToken(): string | null {
    return this.loginState().token;
  }
}
