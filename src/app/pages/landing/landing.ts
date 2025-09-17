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
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  providers: [DialogService],
})
export class Landing implements OnDestroy {
  private authService = inject(AzureAdAuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  loading = false;
  ref: DynamicDialogRef | undefined;
  returnUrl: string = '/';

  constructor(public dialogService: DialogService) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
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
    this.loading = false;
    this.authService.login();
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
}
