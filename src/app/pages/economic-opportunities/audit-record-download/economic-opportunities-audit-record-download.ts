import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-economic-opportunities-audit-record-download',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbModule,
    ButtonModule,
    FloatLabel,
    Select,
    DatePickerModule,
  ],
  templateUrl: './economic-opportunities-audit-record-download.html',
  styleUrl: './economic-opportunities-audit-record-download.scss',
})
export class EconomicOpportunitiesAuditRecordDownload {
  selectedModule: string | null = null;
  fromDate: Date | null = null;
  toDate: Date | null = null;

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Audit Log', icon: 'fas fa-history' },
  ];

  templateOptions = [
    { label: 'Household Group View Template', value: 'Household Group View Template' },
    { label: 'Beneficiary Randomization Enrollment Template', value: 'Beneficiary Randomization Enrollment Template' },
    { label: 'Course Entity Template', value: 'Course Entity Template' },
    { label: 'Course Details Template', value: 'Course Details Template' },
    { label: 'Training Attendance Tracking Template', value: 'Training Attendance Tracking Template' },
    { label: 'Business Plan Development Template', value: 'Business Plan Development Template' },
    { label: 'Coaching Entity Template', value: 'Coaching Entity Template' },
    { label: 'Coaching Details Template', value: 'Coaching Details Template' },
    { label: 'Coaching Session tracking Template', value: 'Coaching Session tracking Template' },
    { label: 'Livelihood Grant Disbursement Template', value: 'Livelihood Grant Disbursement Template' },
    { label: 'Financial Service Linkage Tracking Template', value: 'Financial Service Linkage Tracking Template' },
  ];

  onSearch(): void {
    console.log('Searching audit logs...', {
      module: this.selectedModule,
      from: this.fromDate,
      to: this.toDate,
    });
  }

  resetFilters(): void {
    this.selectedModule = null;
    this.fromDate = null;
    this.toDate = null;
  }

  onDownload(): void {
    console.log('Downloading audit logs...');
  }
}
