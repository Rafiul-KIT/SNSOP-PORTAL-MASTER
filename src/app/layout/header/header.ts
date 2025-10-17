import { Component, effect, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterModule, NavigationEnd } from '@angular/router';
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
  showPortalOptions: boolean = false;
  showUsermenu: boolean = false;
  portalList: any = [];
  menuList: MenuItem[] = [];
  userInfo: any = null;
  isPortalsPage: boolean = false;
  isLandingPage: boolean = false;


  constructor(
    private router: Router,
    private azureService: AzureAdAuthService
  ) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isPortalsPage = event.urlAfterRedirects !== '/landing';
      this.isLandingPage = event.urlAfterRedirects === '/landing';
      const isUserManagementPage = event.urlAfterRedirects.startsWith('/pages/user-management/');
      this.updateMenuList(isUserManagementPage);
    });

    effect(() => {
      this.userInfo = this.azureService.loginState()?.user;
      const isUserManagementPage = this.router.url.startsWith('/pages/user-management/');
      this.updateMenuList(isUserManagementPage);
    });

    this.portalList = [
      // {
      //   label: 'Dashboard',
      //   link: environment.portals.master,
      //   icon: 'fas fa-dashboard',
      // },
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
      {
        label: 'Survey CTO',
        icon: 'fas fa-poll',
      },
    ];
  }

  /*updateMenuList(isUserManagementPage: boolean) {
    if (!this.isLandingPage && isUserManagementPage) {
      this.menuList = [
        {
          label: 'User & Role Management',
          icon: 'fas fa-users',
          items: [
            { label: 'User List', icon: 'fas fa-list', routerLink: ['/pages/user-management/users'] },
            { label: 'Register User', icon: 'fas fa-user-plus', routerLink: ['/pages/user-management/register'] },
            { label: 'Role List', icon: 'fas fa-shield', routerLink: ['/pages/user-management/roles'] },
          ],
        },
      ];
    } else {
      this.menuList = [];
    }
  }*/

  /*updateMenuList(isUserManagementPage: boolean) {
    if (this.isLandingPage) {
      this.menuList = [];
      return;
    }

    const state = this.azureService.loginState();
    const permittedMenus = state?.menus || [];

    const parentMenus = permittedMenus.filter((m: any) => !m.parentMenu);
    const menuList: MenuItem[] = [];

    parentMenus.forEach((p: any) => {
      const children = permittedMenus
        .filter((c: any) => c.parentMenu && c.parentMenu.id === p.id)
        .map((child: any) => ({
          label: child.name,
          icon: 'fas fa-angle-right',
          routerLink: [`/${child.url}`],
        }));

      menuList.push({
        label: p.name,
        icon: 'fas fa-folder',
        routerLink: children.length === 0 ? [`/${p.url}`] : undefined,
        items: children.length > 0 ? children : undefined,
      });
    });

    this.menuList = menuList;
  }*/

  updateMenuList(isUserManagementPage: boolean) {
    if (this.isLandingPage) {
      this.menuList = [];
      return;
    }

    const state = this.azureService.loginState();
    const permittedMenus = state?.menus || [];

    const parentMenus = permittedMenus.filter((m: any) => !m.parentMenu);
    const menuList: MenuItem[] = [];

    parentMenus.forEach((p: any) => {
      // Child menus
      const children = permittedMenus
        .filter((c: any) => c.parentMenu && c.parentMenu.id === p.id)
        .map((child: any) => ({
          label: child.name,
          icon: 'fas fa-angle-right',
          routerLink: [`/${child.url}`],  // Assign URL to child menus
        }));

      // If the parent menu has a URL
      if (p.url) {
        // Parent menu has its own routerLink
        menuList.push({
          label: p.name,
          icon: 'fas fa-folder',
          routerLink: [`/${p.url}`],  // Parent has URL
          items: children.length > 0 ? children : undefined, // Child menus if exist
        });
      } else {
        // If parent menu doesn't have URL, add it as a folder with children
        menuList.push({
          label: p.name,
          icon: 'fas fa-folder',
          items: children.length > 0 ? children : undefined, // Only child menus have URLs
        });
      }
    });
    console.log('Updated Menu List:', this.menuList);

    this.menuList = menuList;
  }



  goToProfile = () => {
    this.router.navigateByUrl('/home/profile');
  };

  logout = () => {
    this.azureService.logout();
  };

  trackByFn(index: number, item: any): any {
    return item.label;  // You can change this depending on the uniqueness of the item
  }

}
