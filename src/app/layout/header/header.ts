import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { MenubarModule } from 'primeng/menubar';
import { environment } from '../../../environments/environment';
import { AzureAdAuthService } from '../../../services/azure-ad-auth.service';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-header',
  imports: [RouterModule, ButtonModule, PopoverModule, MenubarModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private azureService = inject(AzureAdAuthService);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private authService = inject(AzureAdAuthService);

  showPortalOptions = false;
  showUsermenu = false;
  portalList: any[] = [];
  isLoading = false;
  showHelpDeskDropdown = false;

  // Signal for current URL to track page state
  currentUrl = signal<string>(this.router.url);

  // Computed properties from login state
  loginState = this.azureService.loginState;
  userInfo = computed(() => this.loginState()?.user);
  permittedMenus = computed(() => this.loginState()?.menus || []);
  allPermittedNames = computed(() => this.permittedMenus().map((m: any) => m.name));

  // canAccessHelpDesk = computed(() => this.allPermittedNames().includes('Help Desk'));
  canAccessHelpDesk = true;

  helpDeskChildren = computed(() => {
    
    const names = this.allPermittedNames();
    return this.filterMenusByAccess(this.getHelpDeskMenuItems(), names);
  });

  // Page detection signals
  isLandingPage = computed(() => this.currentUrl() === '/landing' || this.currentUrl() === '/#/landing');
  isPortalsPage = computed(() => !this.isLandingPage());
  isSurveyCtoPage = computed(() => this.currentUrl().startsWith('/survey-cto') || this.currentUrl().startsWith('/cto-dashboard'));
  isMonitoringPage = computed(() => this.currentUrl().startsWith('/monitoring-evaluation'));
  isEconomicOpportunitiesPage = computed(() => this.currentUrl().startsWith('/economic-opportunities'));
  isHelpDeskPage = computed(() => this.currentUrl().startsWith('/help-desk/'));
  isUserManagementPage = computed(() => this.currentUrl().startsWith('/user-management/'));

  // Computed menu list based on current page and permissions
  menuList = computed(() => {
    if (this.isLandingPage()) return [];

    const names = this.allPermittedNames();

    if (this.isSurveyCtoPage()) {
      return this.filterMenusByAccess(this.getSurveyCtoMenus(), names);
    }
    if (this.isMonitoringPage()) {
      return this.filterMenusByAccess(this.getMonitoringMenus(), names);
    }
    if (this.isEconomicOpportunitiesPage()) {
      return this.filterMenusByAccess(this.getEconomicOpportunitiesMenus(), names);
    }
    if (this.isHelpDeskPage()) {
      return this.filterMenusByAccess(this.getHelpDeskMenuItems(), names);
    }
    if (this.isUserManagementPage()) {
      const masterMenus = this.permittedMenus().filter(
        (m: any) =>
          m.name === 'User Management' ||
          (m.parentMenu && m.parentMenu.name === 'User Management')
      );
      const allowedNames = masterMenus.map((m: any) => m.name);
      return this.filterMenusByAccess(this.getStaticMasterMenus(), allowedNames);
    }
    return [];
  });

  constructor() {
    // Detect route changes and update signal
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });

    // Static portal links
    this.portalList = [
      {
        label: 'Beneficiary',
        link: environment.portals.beneficiary,
        icon: 'fas fa-user-friends',
      },
      {
        label: 'Payment',
         link: environment.portals.payment,
        icon: 'fas fa-credit-card',
      },
      {
        label: 'GRM',
        link: environment.portals.grm,
        icon: 'fas fa-sitemap'
      },
      {
        label: 'Report',
        command: () => {
          this.router.navigate(['/home/metabase']);
          this.showPortalOptions = false;
        },
        icon: 'fas fa-chart-line',
      },
      {
        label: 'Settings',
        icon: 'fas fa-cog',
        command: () => {
          this.router.navigate(['/user-management/users']);
          this.showPortalOptions = false;
        },
      },
      {
        label: 'Survey CTO',
        icon: 'fas fa-poll',
        command: () => {
          this.router.navigate(['/cto-dashboard']);
          this.showPortalOptions = false;
        },
      },
      {
        label: 'Help Desk',
        icon: 'fas fa-headset',
        command: () => {
          this.router.navigate(['/help-desk/dashboard']);
          this.showPortalOptions = false;
        },
      },
      {
        label: 'Monitoring & Evaluation',
        icon: 'fas fa-chart-bar',
        command: () => {
          this.router.navigate(['/monitoring-evaluation/beneficiary-enrolment-summary']);
          this.showPortalOptions = false;
        },
      },
      {
        label: 'Economic Opportunities',
        icon: 'fas fa-briefcase',
        command: () => {
          this.router.navigate(['/economic-opportunities/dashboard']);
          this.showPortalOptions = false;
        },
      },
    ];
  }

  loginWithAzureAD(): void {
    this.isLoading = true;
    this.authService.login();
  }

  getStaticMasterMenus(): MenuItem[] {
    return [
      {
        label: 'User Management',
        icon: 'fas fa-users',
        items: [
          { label: 'User List', icon: 'fas fa-users', routerLink: ['/user-management/users'] },
          { label: 'Register User', icon: 'fas fa-user-plus', routerLink: ['/user-management/register'] },
          { label: 'Role List', icon: 'fas fa-users-rays', routerLink: ['/user-management/roles'] },
        ],
      },
    ];
  }

  getSurveyCtoMenus(): MenuItem[] {
    return [
      { label: 'SurveyCTO Dashboard', icon: 'fas fa-chart-line', routerLink: ['/cto-dashboard'] },
      { label: 'Template Export', icon: 'fas fa-poll', routerLink: ['/survey-cto-export'] },
      { label: 'Data Import', icon: 'fas fa-upload', routerLink: ['/survey-cto-import'] },
      { label: 'Survey Data View', icon: 'fas fa-file-alt', routerLink: ['/survey-cto-report'] }
    ];
  }

  getMonitoringMenus(): MenuItem[] {
    return [
      { label: 'Beneficiary Enrolment Summary', icon: 'fas fa-clipboard-list', routerLink: ['/monitoring-evaluation/beneficiary-enrolment-summary'] },
      { label: 'Cash Transfer Summary', icon: 'fas fa-money-bill-wave', routerLink: ['/monitoring-evaluation/cash-transfer-summary'] },
      { label: 'Result Framework', icon: 'fas fa-bullseye', routerLink: ['/monitoring-evaluation/result-framework'] },
    ];
  }

  getEconomicOpportunitiesMenus(): MenuItem[] {
    return [
      { label: 'E/O Dashboard', icon: 'fas fa-chart-bar', routerLink: ['/economic-opportunities/dashboard'] },
      { label: 'Excel Template Download', icon: 'fas fa-file-import', routerLink: ['/economic-opportunities/template-importing'] },
      { label: 'Excel Template Upload', icon: 'fas fa-file-upload', routerLink: ['/economic-opportunities/template-upload'] },
      { label: 'Household And Group Mapping', icon: 'fas fa-object-group', routerLink: ['/economic-opportunities/household-group-mapping'] },
      {
        label: 'Beneficiary Enrollment',
        icon: 'fas fa-user-check',
        items: [
          { label: 'Beneficiary Randomization Enrollment', icon: 'fas fa-random', routerLink: ['/economic-opportunities/beneficiary-enrollment/beneficiary-randomization-enrollment'] },
          { label: 'Household Group View', icon: 'fas fa-object-group', routerLink: ['/economic-opportunities/beneficiary-enrollment/household-group-view'] },
        ],
      },
      {
        label: 'Course and Training Management',
        icon: 'fas fa-book-reader',
        items: [
          { label: 'Course Entity', icon: 'fas fa-graduation-cap', routerLink: ['/economic-opportunities/course-training/course-entity'] },
          { label: 'Course Details', icon: 'fas fa-info-circle', routerLink: ['/economic-opportunities/course-training/course-details'] },
          { label: 'Training Attendance Tracking', icon: 'fas fa-user-check', routerLink: ['/economic-opportunities/course-training/training-attendance-tracking'] },
        ],
      },
      {
        label: 'Others',
        icon: 'fas fa-ellipsis-h',
        items: [
          { label: 'Business Plan Development', icon: 'fas fa-file-invoice-dollar', routerLink: ['/economic-opportunities/others/business-plan-development'] },
          { label: 'Livelihood Grant Disbursement', icon: 'fas fa-hand-holding-usd', routerLink: ['/economic-opportunities/others/livelihood-grant-disbursement'] },
          { label: 'Financial Service Linkage Tracking', icon: 'fas fa-link', routerLink: ['/economic-opportunities/others/financial-service-linkage-tracking'] },
        ],
      },
    ];
  }

  filterMenusByAccess(menus: MenuItem[], allowedNames: string[]): MenuItem[] {
    return menus
      .filter((menu) => (menu.label && allowedNames.includes(menu.label)) || menu.separator)
      .map((menu) => ({
        ...menu,
        items: menu.items ? this.filterMenusByAccess(menu.items, allowedNames) : undefined,
      }));
  }

  trackByFn(index: number, item: MenuItem): string {
    return item.label ?? index.toString();
  }

  getHelpDeskMenuItems(): MenuItem[] {
    return [
      { label: 'Help Desk Dashboard', routerLink: '/help-desk/dashboard', icon: 'fas fa-tachometer-alt' },
      { label: 'Submit Support Request', routerLink: '/help-desk/submit-request', icon: 'fas fa-plus-circle' },
      { label: 'My Requests', routerLink: '/help-desk/my-requests', icon: 'fas fa-clipboard-list' },
      { label: 'Support Management', routerLink: '/help-desk/support-management', icon: 'fas fa-users-cog' },
      { label: 'Categories & Modules', routerLink: '/help-desk/setup', icon: 'fas fa-sliders' },
      { label: 'Status Tracker', routerLink: '/help-desk/status-tracker', icon: 'fas fa-search' },
      { label: 'Reports', routerLink: '/help-desk/reports', icon: 'fas fa-chart-bar' },
      { separator: true },
      { label: 'User Manual', routerLink: '/help-desk/user-manual', icon: 'fas fa-book' }
    ];
  }

  toggleHelpDeskDropdown = () => {
    this.showHelpDeskDropdown = !this.showHelpDeskDropdown;
  };

  hideHelpDeskDropdown = () => {
    this.showHelpDeskDropdown = false;
  };

  goToProfile = () => {
    this.router.navigateByUrl('/home/profile');
  };

  logout() {
    this.apiService.logout();
    window.location.href = `${environment.portals.master}/#/landing`;
  }
}
