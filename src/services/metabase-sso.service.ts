import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { InteractionRequiredAuthError, SilentRequest } from '@azure/msal-browser';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

const AZURE_AD_SCOPES = ['openid', 'profile', 'email', 'user.read'];

type MetabaseSsoConfig = {
  endpoint: string;
  metabaseUrl: string;
};

type MetabaseSsoResponse = {
  sessionToken: string;
  redirectUrl: string;
};

@Injectable({ providedIn: 'root' })
export class MetabaseSsoService {
  constructor(private msalService: MsalService) {}

  async startLogin(): Promise<void> {
    // A tab opened fresh (no prior in-app navigation, e.g. via window.open()
    // from another portal) has no recent user gesture by the time this async
    // flow resolves, so a second window.open() here would be popup-blocked.
    // In that case redirect the tab itself instead of spawning another one.
    const isStandaloneTab = window.history.length <= 1;
    const metabaseTab = isStandaloneTab ? null : window.open('about:blank', '_blank');

    if (metabaseTab) {
      metabaseTab.opener = null;
    }

    try {
      const azureToken = await this.getAzureAdToken();
      const config = this.getSsoConfig();
      const response = await this.callSsoEndpoint(azureToken, config.endpoint);

      if (response.status === 401) {
        throw new Error('Metabase SSO rejected the current MIS session. Please sign in again.');
      }

      if (!response.ok) {
        throw new Error(`Metabase SSO failed with status ${response.status}.`);
      }

      const body: MetabaseSsoResponse = await response.json();
      const redirectUrl = body.redirectUrl || config.metabaseUrl;

      if (isStandaloneTab) {
        window.location.replace(redirectUrl);
        return;
      }

      if (metabaseTab && !metabaseTab.closed) {
        metabaseTab.location.replace(redirectUrl);
        return;
      }

      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      metabaseTab?.close();
      throw error;
    }
  }

  private getSsoConfig(): MetabaseSsoConfig {
    const configured = (environment as typeof environment & { metabaseSso?: MetabaseSsoConfig }).metabaseSso;

    return configured || {
      endpoint: 'https://qa-gwapp.southsudansafetynet.info/metabase_middleware/',
      metabaseUrl: 'https://analytics.southsudansafetynet.info',
    };
  }

  private async getAzureAdToken(): Promise<string> {
    const activeAccount = this.msalService.instance.getActiveAccount();
    const account = activeAccount || this.msalService.instance.getAllAccounts()[0];

    if (!account) {
      this.startMicrosoftRedirect();
      throw new Error('Redirecting to Microsoft sign-in.');
    }

    if (!activeAccount) {
      this.msalService.instance.setActiveAccount(account);
    }

    const request: SilentRequest = {
      account,
      scopes: AZURE_AD_SCOPES,
    };

    try {
      const response = await firstValueFrom(this.msalService.acquireTokenSilent(request));
      const token = response.idToken;

      if (!token) {
        throw new Error('Azure AD did not return an ID token for Metabase SSO.');
      }

      return token;
    } catch (error) {
      if (this.requiresMicrosoftInteraction(error)) {
        this.startMicrosoftRedirect();
        throw new Error('Redirecting to Microsoft sign-in.');
      }

      console.error('Unable to acquire Azure AD token for Metabase SSO:', error);
      throw new Error('Unable to acquire an Azure AD ID token for Metabase SSO.');
    }
  }

  private startMicrosoftRedirect(): void {
    void firstValueFrom(this.msalService.loginRedirect({
      scopes: AZURE_AD_SCOPES,
      redirectStartPage: window.location.href,
    }));
  }

  private requiresMicrosoftInteraction(error: unknown): boolean {
    return error instanceof InteractionRequiredAuthError ||
      (typeof error === 'object' &&
        error !== null &&
        'errorCode' in error &&
        String(error.errorCode).includes('interaction_required'));
  }

  private async callSsoEndpoint(token: string, endpoint: string): Promise<Response> {
    try {
      return await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Unable to reach Metabase SSO middleware:', error);
      throw new Error('Unable to reach the Metabase SSO middleware.');
    }
  }
}
