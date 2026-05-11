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
        // link: environment.portals.report,
        link: environment.portals.UnderConstruction,
        icon: 'fas fa-chart-line',
      },
      {
        label: 'Settings',
        link: environment.portals.masterSettings,
        icon: 'fas fa-cog',
        tooltipText: 'User & Role Management'
      },
      {
        label: 'Survey CTO',
        icon: 'fas fa-poll',
        routerLink: '/cto-dashboard'
      },
         {
        label: 'Help Desk',
        icon: 'fas fa-headset',
        // link: environment.portals.helpDesk,
        link: environment.portals.UnderConstruction,
        tooltipText: 'IT Support Help Desk'
      },
      {
        label: 'Monitoring & Evaluation',
        icon: 'fas fa-chart-bar',
        link: environment.portals.mNe,
        tooltipText: 'Monitoring & Evaluation'
      },

      {
        label: 'Economic Opportunities',
        icon: 'fas fa-briefcase',
      //   link: environment.portals.economicOpportunities,',
        link: environment.portals.UnderConstruction,
        tooltipText: 'Economic Opportunities'
      },
    ];
  }
}
