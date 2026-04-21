import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-economic-opportunities',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule],
  templateUrl: './economic-opportunities.html',
  styleUrl: './economic-opportunities.scss',
})
export class EconomicOpportunities {
  home = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items = [
    { label: 'Economic Opportunities' },
    { label: 'Overview', icon: 'fas fa-briefcase' },
  ];
}
