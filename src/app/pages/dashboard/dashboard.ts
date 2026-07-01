import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Tooltip, TooltipModule } from 'primeng/tooltip';
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
        icon: 'fas fa-user-friends',
        link: environment.portals.beneficiary,
        tooltipText: 'Beneficiary Management Portal',
      },
      {
        label: 'Payment',
        icon: 'fas fa-credit-card',
        link: environment.portals.payment,
        tooltipText: 'Payment Portal',
      },
      {
        label: 'GRM',
        icon: 'fas fa-sitemap',
        link: environment.portals.grm,
        tooltipText: 'Grievance Redress Mechanism',
      },
      {
        label: 'Economic Opportunities',
        icon: 'fas fa-briefcase',
        // link: environment.portals.economicOpportunities,
        link: environment.portals.economicOpportunities,
        tooltipText: 'Economic Opportunities Portal',
      },
      {
        label: 'Monitoring & Evaluation',
        icon: 'fas fa-chart-bar',
        link: environment.portals.mNe,
        tooltipText: 'Monitoring & Evaluation Portal',
      },
      {
        label: 'Survey CTO',
        icon: 'fas fa-poll',
        link: environment.portals.surveyCTO,
        tooltipText: 'Survey CTO Portal',
      },
      // {
      //   label: 'Report',
      //   routerLink: '/home/metabase',
      //   icon: 'fas fa-chart-line',
      // },
      {
        label: 'Report',
        icon: 'fas fa-chart-line',
        routerLink: '/home/metabase',
        tooltipText: 'Reports Dashboard',
      },
      // {
      //   label: 'Help Desk',
      //   icon: 'fas fa-headset',
      //   link: environment.portals.helpDesk,

      //   tooltipText: 'Help Desk Portal - IT Support',
      // },
      {
        label: 'DMS',
        icon: 'fas fa-file',
        link: environment.portals.dms,
        tooltipText: 'Document Management System'
      },
      {
        label: 'Settings',
        icon: 'fas fa-cog',
        link: environment.portals.masterSettings,
        tooltipText: 'Settings portal - User & Role Management',
      },
      // {
      //   label: 'Automated Targeting',
      //   icon: 'fas fa-arrows-down-to-people',
      //   routerLink: '/automated-targeting/dashboard',
      //   tooltipText: 'Automated Targeting Portal',
      // },
    ];
  }
}
