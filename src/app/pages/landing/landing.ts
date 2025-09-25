import { Component, OnDestroy } from '@angular/core';
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
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  providers: [DialogService],
})
export class Landing implements OnDestroy {
  private authService = inject(AzureAdAuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private msalBroadcastService = inject(MsalBroadcastService);
  isLoading = false;
  ref: DynamicDialogRef | undefined;
  returnUrl: string = '/';
  private readonly _destroying$ = new Subject<void>();

  constructor(public dialogService: DialogService) {
    // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    // if (this.authService.isAuthenticated()) {
    //   this.router.navigate([this.returnUrl]);
    // }
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
    // Optionally, you can check authentication status here or call a success/failure handler
    this.isLoading = false; // Hide the loading spinner when login finishes
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
