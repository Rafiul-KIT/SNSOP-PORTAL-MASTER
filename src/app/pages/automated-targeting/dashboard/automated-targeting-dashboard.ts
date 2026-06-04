import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Loader } from '../../../components/loader/loader';

@Component({
  selector: 'app-automated-targeting-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    Loader,
  ],
  templateUrl: './automated-targeting-dashboard.html',
  styleUrls: ['./automated-targeting-dashboard.scss'],
})
export class AutomatedTargetingDashboard implements OnInit {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/automated-targeting/dashboard' };
  breadcrumbItems = [
    { label: 'Automated Targeting', icon: 'fas fa-arrows-down-to-people' },
    { label: 'Dashboard' },
  ];

  summary = {
    totalEntries: 0,
    disHouseholds: 0,
    lipwHouseholds: 0,
  };

  isLoading = true;

  constructor(private router: Router) {}

  ngOnInit() {
    // Summary values may be populated from API later.
    this.isLoading = false;
  }

  goToResultList() {
    this.router.navigate(['/automated-targeting/results']);
  }
}
