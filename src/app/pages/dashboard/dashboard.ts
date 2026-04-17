import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, TooltipModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  portalList: any = [];

  constructor(private router: Router) {
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
      {
        label: 'GRM',
        link: environment.portals.grm,
        icon: 'fas fa-sitemap'
      },
      {
        label: 'Report',
        routerLink: '/home/metabase',
        icon: 'fas fa-chart-line',
      },
      {
        label: 'Settings',
        icon: 'fas fa-cog',
        routerLink: '/user-management/users',
        tooltipText: 'User & Role Management'
      },
      {
        label: 'Survey CTO',
        icon: 'fas fa-poll',
        routerLink: '/cto-dashboard'
      },
      {
        label: 'M&E',
        icon: 'fas fa-chart-bar',
        routerLink: '/monitoring-evaluation/beneficiary-enrolment-summary',
        tooltipText: 'Monitoring & Evaluation'
      },
      {
        label: 'Help Desk',
        icon: 'fas fa-headset',
        routerLink: '/help-desk/dashboard',
        tooltipText: 'IT Support Help Desk'
      },
      {
        label: 'Economic Opportunities',
        icon: 'fas fa-briefcase',
        routerLink: '/under-construction',
        tooltipText: 'Economic Opportunities (Coming Soon)'
      },
    ];
  }
}
