import { Component, effect, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { MenubarModule } from 'primeng/menubar';
import { environment } from '../../../environments/environment';
import { AzureAdAuthService } from '../../../services/azure-ad-auth.service';
import { MenuItem } from 'primeng/api';

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

  constructor(
    private router: Router,
    private azureService: AzureAdAuthService
  ) {

    effect(() => {
      this.userInfo = this.azureService.loginState()?.user;
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
    ];

    this.menuList = [
      {
        label: 'User & Role Management',
        icon: 'pi pi-users',
        items: [
          { label: 'User List', icon: 'pi pi-list', routerLink: ['/user-management/users'] },
          { label: 'Register User', icon: 'pi pi-user-plus', routerLink: ['/user-management/register'] },
          { separator: true },
          { label: 'Role List', icon: 'pi pi-shield', routerLink: ['/user-management/roles'] },
        ],
      },
      // ...other top-level items if you want (Settings, Report, etc.)
    ];
  }

  goToProfile = () => {
    this.router.navigateByUrl('/home/profile');
  };

  logout = () => {
    this.azureService.logout();
  };
}
