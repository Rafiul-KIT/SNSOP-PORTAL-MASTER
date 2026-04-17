import { Component, effect, inject } from '@angular/core';
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
  showPortalOptions = false;
  showUsermenu = false;
  portalList: any[] = [];
  menuList: MenuItem[] = [];
  userInfo: any = null;
  isPortalsPage = false;
  isLandingPage = false;
  isSurveyCtoPage = false;
  isMonitoringPage = false;
  isLoading = false;
  canAccessHelpDesk: boolean = false;
  showHelpDeskDropdown: boolean = false;
  helpDeskChildren: any[] = this.getHelpDeskMenuItems();
  private authService = inject(AzureAdAuthService);

  constructor(
    private router: Router,
    private azureService: AzureAdAuthService,
    private apiService: ApiService,
  ) {
    // Detect route changes
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        this.isPortalsPage = event.urlAfterRedirects !== '/landing';
        this.isLandingPage = event.urlAfterRedirects === '/landing';
        const isUserManagementPage = event.urlAfterRedirects.startsWith(
          '/user-management/'
        );
        this.isSurveyCtoPage = event.urlAfterRedirects.startsWith('/survey-cto') || event.urlAfterRedirects.startsWith('/cto-dashboard');
        this.isMonitoringPage = event.urlAfterRedirects.startsWith('/monitoring-evaluation');
        this.updateMenuList(isUserManagementPage, this.isSurveyCtoPage, this.isMonitoringPage);
      });

    // Watch login state
    effect(() => {
      const state = this.azureService.loginState();
      this.userInfo = state?.user;
      const isUserManagementPage = this.router.url.startsWith(
        '/user-management/'
      );
      this.isSurveyCtoPage = this.router.url.startsWith('/survey-cto') || this.router.url.startsWith('/cto-dashboard');
      this.updateMenuList(isUserManagementPage, this.isSurveyCtoPage);

      // Help Desk access: show when user is logged in
      if (this.userInfo) {
        const permittedMenus = state?.menus || [];
        const allPermittedNames = permittedMenus.map((m: any) => m.name);
        this.canAccessHelpDesk = allPermittedNames.includes('Help Desk') || true;
      } else {
        this.canAccessHelpDesk = false;
      }
      this.isMonitoringPage = this.router.url.startsWith('/monitoring-evaluation');
      this.updateMenuList(isUserManagementPage, this.isSurveyCtoPage, this.isMonitoringPage);
    });

    // Static portal links (unchanged)
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
          this.router.navigate(['/under-construction']);
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
        label: 'Economic Opportunities',
        icon: 'fas fa-briefcase',
        command: () => {
          this.router.navigate(['/under-construction']);
          this.showPortalOptions = false;
        },
      },
      {
        label: 'M&E',
        icon: 'fas fa-chart-bar',
        command: () => {
          this.router.navigate(['/monitoring-evaluation/beneficiary-enrolment-summary']);
          this.showPortalOptions = false;
        },
      },
    
    ];
  }

  loginWithAzureAD(): void {
    this.isLoading = true; // Show the loading spinner when login starts
    this.authService.login(); // Just call login if it doesn't return a Promise
  }

  // ✅ 1. Match backend labels exactly
  getStaticMasterMenus(): MenuItem[] {
    return [
      {
        label: 'User Management', // must match backend name
        icon: 'fas fa-users',
        items: [
          {
            label: 'User List',
            icon: 'fas fa-users',
            routerLink: ['/user-management/users'],
          },
          {
            label: 'Register User',
            icon: 'fas fa-user-plus',
            routerLink: ['/user-management/register'],
          },
          {
            label: 'Role List',
            icon: 'fas fa-users-rays',
            routerLink: ['/user-management/roles'],
          },
        ],
      },
    ];
  }

  getSurveyCtoMenus(): MenuItem[] {
    return [
      {
        label: 'SurveyCTO Dashboard',
        icon: 'fas fa-chart-line',
        routerLink: ['/cto-dashboard'],
      },
      {
        label: 'Template Export',
        icon: 'fas fa-poll',
        routerLink: ['/survey-cto-export'],
      },
      {
        label: 'Data Import',
        icon: 'fas fa-upload',
        routerLink: ['/survey-cto-import'],
      },
      {
        label: 'Survey Data View',
        icon: 'fas fa-file-alt',
        routerLink: ['/survey-cto-report'],
      }
    ];
  }

  getMonitoringMenus(): MenuItem[] {
    return [
      {
        label: 'Beneficiary Enrolment Summary',
        icon: 'fas fa-clipboard-list',
        routerLink: ['/monitoring-evaluation/beneficiary-enrolment-summary'],
      },
      {
        label: 'Cash Transfer Summary',
        icon: 'fas fa-money-bill-wave',
        routerLink: ['/monitoring-evaluation/cash-transfer-summary'],
      },
      {
        label: 'Result Framework',
        icon: 'fas fa-bullseye',
        routerLink: ['/monitoring-evaluation/result-framework'],
      },
    ];
  }

  updateMenuList(isUserManagementPage: boolean, isSurveyCtoPage: boolean, isMonitoringPage: boolean = false) {
    if (this.isLandingPage) {
      this.menuList = [];
      return;
    }

    if (isSurveyCtoPage) {
      this.menuList = this.getSurveyCtoMenus();
      return;
    }

    if (isMonitoringPage) {
      this.menuList = this.getMonitoringMenus();
      return;
    }

    const state = this.azureService.loginState();
    const permittedMenus = state?.menus || [];

    // Get the current route path without query parameters
    const currentPath = this.router.url.split('?')[0];  // Strip out query parameters

    // Filter backend menus only for master portal ones
    const masterMenus = permittedMenus.filter(
      (m: any) =>
        m.name === 'User Management' ||
        (m.parentMenu && m.parentMenu.name === 'User Management')
    );

    const allowedNames = masterMenus.map((m: any) => m.name);
    const staticMenus = this.getStaticMasterMenus();
    const filteredMenus = this.filterMenusByAccess(staticMenus, allowedNames);

    // Only apply menus when in user-management pages (using currentPath)
    this.menuList = currentPath.startsWith('/user-management/') ? filteredMenus : [];
  }



  // ✅ Recursive filter: keep only allowed menus
  filterMenusByAccess(menus: MenuItem[], allowedNames: string[]): MenuItem[] {
    return menus
      .filter((menu) => menu.label && allowedNames.includes(menu.label)) // ensure label is not undefined
      .map((menu) => ({
        ...menu,
        items: menu.items
          ? this.filterMenusByAccess(menu.items, allowedNames)
          : undefined,
      }));
  }

  trackByFn(index: number, item: MenuItem): string {
    return item.label ?? index.toString(); // fallback to index if label is undefined
  }

  getHelpDeskMenuItems(): any[] {
    return [
      { label: 'Help Desk Dashboard', routerLink: '/help-desk/dashboard', icon: 'fas fa-tachometer-alt' },
      { label: 'Submit Support Request', routerLink: '/help-desk/submit-request', icon: 'fas fa-plus-circle' },
      { label: 'My Requests', routerLink: '/help-desk/my-requests', icon: 'fas fa-clipboard-list' },
      { label: 'Support Management', routerLink: '/help-desk/support-management', icon: 'fas fa-users-cog' },
      { label: 'Status Tracker', routerLink: '/help-desk/status-tracker', icon: 'fas fa-search' },
      { label: 'Reports', routerLink: '/help-desk/reports', icon: 'fas fa-chart-bar' },
      { separator: true, label: 'User Manual', routerLink: '/help-desk/user-manual', icon: 'fas fa-book' }
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
