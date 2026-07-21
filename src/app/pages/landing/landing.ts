import { Component, OnDestroy, OnInit, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SignIn } from '../sign-in/sign-in';
import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AzureAdAuthService } from '../../../services/azure-ad-auth.service';
import { Loader } from '../../components/loader/loader';
import { MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { Subject, filter, takeUntil } from 'rxjs';
import { Toast } from 'primeng/toast';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  imports: [
    RouterModule,
    ButtonModule,
    CommonModule,
    CardModule,
    DividerModule,
    ProgressSpinnerModule,
    Loader,
    Toast
    
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  providers: [DialogService],
})
export class Landing implements OnDestroy, OnInit {
  readonly environmentBanner = environment.env === 'prod'
    ? null
    : environment.env === 'qa' ? 'QA' : 'DEV';

  private authService = inject(AzureAdAuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private msalBroadcastService = inject(MsalBroadcastService);
  isLoading = false;
  ref: DynamicDialogRef | undefined;
  returnUrl: string = '/';
  private readonly _destroying$ = new Subject<void>();

  constructor(public dialogService: DialogService) {
    // Synchronously check for an authentication redirect hash in the URL.
    // This prevents the landing page from flashing content when a login redirect is being processed.
    if (window.location.hash.includes('code=') || window.location.hash.includes('id_token=')) {
      this.isLoading = true;
    }

    // Use an effect to react to changes in the loginState signal
    // This will trigger navigation once the exchange token is available
    effect(() => {
      if (this.authService.loginState().token && this.router.url === '/landing') {
        this.router.navigate(['/home/portals']);
      }
    });
  }

  ngOnInit() {
    this.msalBroadcastService.inProgress$
      .pipe(
        filter(
          (status: InteractionStatus) => status === InteractionStatus.None
        ),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        // If the exchange token is not yet available, and no redirect is processing, hide the loader
        if (!this.authService.loginState().token) {
          const isRedirectProcessing = window.location.hash.includes('code=') || window.location.hash.includes('id_token=');
          if (!isRedirectProcessing) {
            this.isLoading = false;
          }
        }
        // If the token is available, the effect will handle navigation.
        // If the token is not available, and it's a redirect, isLoading remains true.
        // If the token is not available, and it's not a redirect, isLoading becomes false.
      });
  }

  showLogin() {
    this.ref = this.dialogService.open(SignIn, {
      width: '500px',
      styleClass: 'headless',
      modal: true,
      breakpoints: {
        '960px': '500px',
        '640px': '400px',
        '400px': '350px',
      },
    });
    this.ref.onClose.subscribe((event: any) => {
      console.log(event);
    });
  }

  loginWithAzureAD(): void {
    this.isLoading = true; // Show the loading spinner when login starts
    this.authService.login(); // Just call login if it doesn't return a Promise
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
