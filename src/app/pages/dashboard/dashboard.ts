import { Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, NgTemplateOutlet],
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
        description: 'Beneficiary management',
      },
      {
        label: 'Payment',
        icon: 'fas fa-credit-card',
        link: environment.portals.payment,
        description: 'Payments to beneficiaries',
      },
      {
        label: 'GRM',
        icon: 'fas fa-sitemap',
        link: environment.portals.grm,
        description: 'Grievance redress mechanism',
      },
      {
        label: 'Economic Opportunities',
        icon: 'fas fa-briefcase',
        // link: environment.portals.economicOpportunities,
        link: environment.portals.economicOpportunities,
        description: 'Livelihood support and training',
      },
      {
        label: 'Monitoring & Evaluation',
        icon: 'fas fa-chart-bar',
        link: environment.portals.mNe,
        description: 'Monitoring and evaluation',
      },
      {
        label: 'Survey CTO',
        icon: 'fas fa-poll',
        link: environment.portals.surveyCTO,
        description: 'SurveyCTO field data',
      },
      // {
      //   label: 'Report',
      //   routerLink: '/home/metabase',
      //   icon: 'fas fa-chart-line',
      // },
      {
        label: 'Analytics Report',
        icon: 'fas fa-chart-line',
        routerLink: '/home/metabase',
        description: 'Reports dashboard',
      },
      // {
      //   label: 'Help Desk',
      //   icon: 'fas fa-headset',
      //   link: environment.portals.helpDesk,

      //   description: 'IT support help desk',
      // },
      {
        label: 'DMS',
        icon: 'fas fa-file',
        link: environment.portals.dms,
        description: 'Document management system'
      },
      {
        label: 'Settings',
        icon: 'fas fa-cog',
        link: environment.portals.masterSettings,
        description: 'User and role management',
      },
      // {
      //   label: 'Automated Targeting',
      //   icon: 'fas fa-arrows-down-to-people',
      //   routerLink: '/automated-targeting/dashboard',
      //   description: 'Automated targeting',
      // },
    ];
  }
}
