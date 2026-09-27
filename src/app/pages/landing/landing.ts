import { Component, OnDestroy, OnInit, computed, effect, signal } from '@angular/core';
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
import { LandingService, LandingSummary } from '../../../services/landing.service';

type SummaryStatus = 'loading' | 'ready' | 'error';

interface SplitPart {
  label: string;
  count: number;
  pct: number;
}

const COUNT_UP_MS = 1600;

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

  readonly appVersion = '3.0.0';
  readonly currentYear = new Date().getFullYear();

  private landingService = inject(LandingService);
  private animationFrame: number | null = null;

  readonly summaryStatus = signal<SummaryStatus>('loading');
  readonly asOf = signal<Date>(new Date());
  readonly summary = signal<LandingSummary | null>(null);
  // Eased 0 -> 1 progress that drives the count-up numbers and bar widths together.
  readonly progress = signal(0);

  readonly animated = computed(() => {
    const s = this.summary();
    const p = this.progress();
    const scale = (n: number | null | undefined) => Math.round((n ?? 0) * p);
    return {
      totalBeneficiary: scale(s?.totalBeneficiary),
      totalWorkedBeneficiary: scale(s?.totalWorkedBeneficiary),
      totalSspPaid: scale(s?.totalSspPaid),
      totalCompletedSubprojects: scale(s?.totalCompletedSubprojects),
    };
  });

  readonly genderSplit = computed(() =>
    this.split([
      ['Female', this.summary()?.femaleCount],
      ['Male', this.summary()?.maleCount],
    ])
  );

  readonly programmeSplit = computed(() =>
    this.split([
      ['LIPW', this.summary()?.lipwCount],
      ['DIS', this.summary()?.disCount],
    ])
  );

  readonly components = [
    {
      title: 'Cash Transfers',
      text: 'Cash assistance to vulnerable households through Labour-Intensive Public Works and Direct Income Support.',
      image: 'images/landing/cash-transfers.jpg',
      alt: 'A woman receiving a cash payment at a bank counter',
    },
    {
      title: 'Economic Opportunities',
      text: 'Livelihood support and training that help poor and vulnerable youth become productive and self-reliant.',
      image: 'images/landing/economic-opportunities.jpg',
      alt: 'A young woman presenting a programme at a local radio station',
    },
    {
      title: 'Institutional Strengthening',
      text: 'Building government capacity for social protection and the national safety net delivery system, including the MIS.',
      image: 'images/landing/institutional-strengthening.jpg',
      alt: 'A trainer leading a session in front of a blackboard',
    },
    {
      title: 'M&E and Knowledge',
      text: 'Project management, monitoring and knowledge generation to inform policy-making.',
      image: 'images/landing/monitoring.jpg',
      alt: 'Community members collecting water at a project site',
    },
  ];

  readonly partners = [
    { role: 'Implementing Ministries', name: 'MGCSW & MAFS' },
    { role: 'Financing Partner', name: 'The World Bank (IDA)' },
    { role: 'Support', name: 'UNOPS and third-party agencies' },
    { role: 'Coordination', name: 'National Social Protection Working Group' },
  ];

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
    this.loadSummary();

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

  async loadSummary(): Promise<void> {
    this.summaryStatus.set('loading');
    const data = await this.landingService.getSummary();
    if (!data) {
      this.summaryStatus.set('error');
      return;
    }
    this.summary.set(data);
    this.asOf.set(new Date());
    this.summaryStatus.set('ready');
    this.startCountUp();
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  formatCount(value: number): string {
    return value >= 1_000_000 ? this.compact(value) : value.toLocaleString('en-US');
  }

  formatFull(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('en-US');
  }

  compact(value: number): string {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: value >= 1_000_000 ? 2 : 1,
    }).format(value);
  }

  private split(parts: [string, number | null | undefined][]): SplitPart[] {
    const total = parts.reduce((sum, [, n]) => sum + (n ?? 0), 0);
    return parts.map(([label, n]) => ({
      label,
      count: n ?? 0,
      pct: total ? ((n ?? 0) / total) * 100 : 0,
    }));
  }

  private startCountUp(): void {
    this.cancelCountUp();
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      this.progress.set(1);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / COUNT_UP_MS, 1);
      this.progress.set(1 - Math.pow(1 - t, 3)); // ease-out cubic
      this.animationFrame = t < 1 ? requestAnimationFrame(tick) : null;
    };
    this.progress.set(0);
    this.animationFrame = requestAnimationFrame(tick);
  }

  private cancelCountUp(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  loginWithAzureAD(): void {
    this.isLoading = true; // Show the loading spinner when login starts
    this.authService.login(); // Just call login if it doesn't return a Promise
  }

  ngOnDestroy() {
    this.cancelCountUp();
    if (this.ref) {
      this.ref.close();
    }
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
