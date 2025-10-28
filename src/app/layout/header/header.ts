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
  isLoading = false;
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
        this.updateMenuList(isUserManagementPage);
      });

    // Watch login state
    effect(() => {
      this.userInfo = this.azureService.loginState()?.user;
      const isUserManagementPage = this.router.url.startsWith(
        '/user-management/'
      );
      this.updateMenuList(isUserManagementPage);
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
      { label: 'GRM', link: environment.portals.grm, icon: 'fas fa-sitemap' },
      {
        label: 'Report',
        link: environment.portals.report,
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
      { label: 'Survey CTO', icon: 'fas fa-poll' },
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
            icon: 'fas fa-list',
            routerLink: ['/user-management/users'],
          },
          {
            label: 'Register User',
            icon: 'fas fa-user-plus',
            routerLink: ['/user-management/register'],
          },
          {
            label: 'Role List',
            icon: 'fas fa-shield',
            routerLink: ['/user-management/roles'],
          },
        ],
      },
    ];
  }

  updateMenuList(isUserManagementPage: boolean) {
    if (this.isLandingPage) {
      this.menuList = [];
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

  goToProfile = () => {
    this.router.navigateByUrl('/home/profile');
  };
  logout() {
    this.apiService.logout();
    window.location.href = `${environment.portals.master}/#/landing`;
  }
}