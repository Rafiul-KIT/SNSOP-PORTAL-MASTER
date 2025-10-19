import { Component, effect } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { MenubarModule } from 'primeng/menubar';
import { environment } from '../../../environments/environment';
import { AzureAdAuthService } from '../../../services/azure-ad-auth.service';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs';

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

  constructor(
    private router: Router,
    private azureService: AzureAdAuthService
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
          '/pages/user-management/'
        );
        this.updateMenuList(isUserManagementPage);
      });

    // Watch login state
    effect(() => {
      this.userInfo = this.azureService.loginState()?.user;
      const isUserManagementPage = this.router.url.startsWith(
        '/pages/user-management/'
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
          this.router.navigate(['/pages/user-management/users']);
          this.showPortalOptions = false;
        },
      },
      { label: 'Survey CTO', icon: 'fas fa-poll' },
    ];
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
          routerLink: ['/pages/user-management/users'],
        },
        {
          label: 'Register User',
          icon: 'fas fa-user-plus',
          routerLink: ['/pages/user-management/register'],
        },
        {
          label: 'Role List',
          icon: 'fas fa-shield',
          routerLink: ['/pages/user-management/roles'],
        },
      ],
    },
  ];
}

// ✅ 2. Filter to show only menus that exist in both backend + static
updateMenuList(isUserManagementPage: boolean) {
  if (this.isLandingPage) {
    this.menuList = [];
    return;
  }

  const state = this.azureService.loginState();
  const permittedMenus = state?.menus || [];

  // Filter backend menus only for master portal ones
  const masterMenus = permittedMenus.filter(
    (m: any) =>
      m.name === 'User Management' ||
      (m.parentMenu && m.parentMenu.name === 'User Management')
  );

  const allowedNames = masterMenus.map((m: any) => m.name);
  const staticMenus = this.getStaticMasterMenus();
  const filteredMenus = this.filterMenusByAccess(staticMenus, allowedNames);

  // Only apply menus when in master portal pages
  this.menuList = isUserManagementPage ? filteredMenus : [];
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
  logout = () => {
    this.azureService.logout();
  };
}
