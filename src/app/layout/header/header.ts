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
      this.updateMenuList();
    });

    effect(() => {
      this.userInfo = this.azureService.loginState()?.user;
      this.updateMenuList();
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
      },
      {
        label: 'Survey CTO',
        icon: 'fas fa-poll',
      },
    ];
  }

  updateMenuList() {
    if (!this.isLandingPage) {
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
