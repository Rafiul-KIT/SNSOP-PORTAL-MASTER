/*
import { Injectable, signal } from '@angular/core';
import axios, { AxiosInstance } from 'axios';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private globalApi = environment.globalApi;
  private authApi    = 'https://alt.example.com';// e.g. https://api.yourdomain.com
  public ACCESS_TOKEN = environment.cookie_name;       // cookie key for auth token
  public loginState = signal<{ token: string | null; user: any | null }>({
    token: null,
    user: null,
  });

  private apiHeader = {
    headers: { 'Content-Type': 'application/json' },
  };

  public axiosInstance: AxiosInstance = axios.create({
    baseURL: this.globalApi,
  });

  constructor(private cookies: CookieService, private router: Router) {
    const token = this.cookies.get(this.ACCESS_TOKEN);
    if (token) {
      const userData: any = safeDecode(token);
      this.loginState.set({ token, user: userData });
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Attach latest token on each request
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const fresh = this.cookies.get(this.ACCESS_TOKEN);
        if (fresh) config.headers!['Authorization'] = `Bearer ${fresh}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle 401s globally
    this.axiosInstance.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error?.response?.status === 401) {
          console.warn('401 Unauthorized → logging out…');
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  logout = () => {
    // Delete all cookies for this domain (adjust path/domain if needed)
    this.cookies.deleteAll('/', environment.domain, false);
    this.loginState.set({ token: null, user: null });

    const landingPath = environment.useHash ? '/#/landing' : '/landing';
    const redirectUrl = `${environment.portals.master}${landingPath}`;
    window.location.href = redirectUrl;
  };

  // -------------- Basic HTTP helpers --------------
  GET = <T = any>(endpoint: string, params?: Record<string, any>) =>
    this.axiosInstance.get<T>(endpoint, { ...this.apiHeader, params });

  POST = <T = any>(endpoint: string, payload: any) =>
    this.axiosInstance.post<T>(endpoint, payload, this.apiHeader);

  PUT = <T = any>(endpoint: string, payload?: any) =>
    this.axiosInstance.put<T>(endpoint, payload ?? {}, this.apiHeader);

  PATCH = <T = any>(endpoint: string, payload: any) =>
    this.axiosInstance.patch<T>(endpoint, payload, this.apiHeader);

  DELETE = <T = any>(endpoint: string) =>
    this.axiosInstance.delete<T>(endpoint, this.apiHeader);
}

// Safer decode to avoid throwing on malformed tokens
function safeDecode(token: string) {
  try { return jwtDecode(token); } catch { return null; }
}
*/


import { Injectable, signal } from '@angular/core';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

type BaseKey = 'global' | 'alt';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // ---- Base URLs ----
  private globalApi = environment.globalApi;              // e.g. https://api.yourdomain.com
  private altApi    = environment.authBackend;          // <-- hardcode here if you want
  // OR: private altApi = environment.altApi;

  public ACCESS_TOKEN = environment.cookie_name;

  public loginState = signal<{ token: string | null; user: any | null }>({
    token: null,
    user: null,
  });

  private apiHeader = {
    headers: { 'Content-Type': 'application/json' },
  };

  // ---- Two axios clients ----
  private axiosGlobal: AxiosInstance = axios.create({ baseURL: this.globalApi });
  private axiosAlt:    AxiosInstance = axios.create({ baseURL: this.altApi });

  constructor(private cookies: CookieService, private router: Router) {
    const token = this.cookies.get(this.ACCESS_TOKEN);
    if (token) {
      const userData: any = safeDecode(token);
      this.loginState.set({ token, user: userData });

      this.axiosGlobal.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      this.axiosAlt.defaults.headers.common['Authorization']    = `Bearer ${token}`;
    }

    // Attach interceptors to BOTH instances
    this.attachInterceptors(this.axiosGlobal);
    this.attachInterceptors(this.axiosAlt);
  }

  private attachInterceptors(inst: AxiosInstance) {
    // Request: fresh token
    inst.interceptors.request.use(
      (config) => {
        const fresh = this.cookies.get(this.ACCESS_TOKEN);
        if (fresh) {
          config.headers = config.headers ?? {};
          config.headers['Authorization'] = `Bearer ${fresh}`;
        }
        if (!config.headers?.['Content-Type']) {
          config.headers = config.headers ?? {};
          config.headers['Content-Type'] = 'application/json';
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response: 401
    inst.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error?.response?.status === 401) {
          console.warn('401 Unauthorized → logging out…');
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  private client(base: BaseKey): AxiosInstance {
    return base === 'alt' ? this.axiosAlt : this.axiosGlobal;
  }

  logout = () => {
    this.cookies.deleteAll('/', environment.domain, false);
    this.loginState.set({ token: null, user: null });

    // Build redirect URL dynamically
    const landingPath = environment.useHash ? '/#/landing' : '/landing';
    const redirectUrl = `${environment.portals.master}${landingPath}`;

    window.location.href = redirectUrl;
  };

  // -------------- Helpers with optional base param (default: 'global') --------------
  GET  = <T = any>(endpoint: string, params?: Record<string, any>, base: BaseKey = 'global', config?: AxiosRequestConfig) =>
    this.client(base).get<T>(endpoint, { ...this.apiHeader, params, ...(config ?? {}) });

  POST = <T = any>(endpoint: string, payload: any, base: BaseKey = 'global', config?: AxiosRequestConfig) =>
    this.client(base).post<T>(endpoint, payload, { ...this.apiHeader, ...(config ?? {}) });

  PUT  = <T = any>(endpoint: string, payload?: any, base: BaseKey = 'global', config?: AxiosRequestConfig) =>
    this.client(base).put<T>(endpoint, payload ?? {}, { ...this.apiHeader, ...(config ?? {}) });

  PATCH= <T = any>(endpoint: string, payload: any, base: BaseKey = 'global', config?: AxiosRequestConfig) =>
    this.client(base).patch<T>(endpoint, payload, { ...this.apiHeader, ...(config ?? {}) });

  DELETE= <T = any>(endpoint: string, base: BaseKey = 'global', config?: AxiosRequestConfig) =>
    this.client(base).delete<T>(endpoint, { ...this.apiHeader, ...(config ?? {}) });
}

// safe decode
function safeDecode(token: string) {
  try { return jwtDecode(token); } catch { return null; }
}
