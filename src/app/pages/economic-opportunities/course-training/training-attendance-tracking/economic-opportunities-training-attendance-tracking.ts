import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-economic-opportunities-training-attendance-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbModule],
  templateUrl: './economic-opportunities-training-attendance-tracking.html',
  styleUrl: './economic-opportunities-training-attendance-tracking.scss',
})
export class EconomicOpportunitiesTrainingAttendanceTracking {
  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Course Training' },
    { label: 'Training Attendance Tracking', icon: 'fas fa-user-check' },
  ];
}
