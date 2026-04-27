import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { MenuItem } from 'primeng/api';
import { EconomicOpportunitiesBeneficiaryRandomizationEnrollment } from '../beneficiary-randomization-enrollment/economic-opportunities-beneficiary-randomization-enrollment';

@Component({
  selector: 'app-economic-opportunities-template-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbModule,
    ButtonModule,
    FloatLabel,
    Select,
    EconomicOpportunitiesBeneficiaryRandomizationEnrollment,
  ],
  templateUrl: './economic-opportunities-template-upload.html',
  styleUrl: './economic-opportunities-template-upload.scss',
})
export class EconomicOpportunitiesTemplateUpload {
  selectedType = '';
  selectedFile: File | null = null;
  showBeneficiaryTable = false;
  beneficiaryData: any[] = [];

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Template Upload', icon: 'fas fa-file-upload' },
  ];

  typeOptions = [
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

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  onAnalyze(): void {
    console.log('Analyze clicked');
  }

  onImport(): void {
    console.log('Import clicked');
  }

  onSearch(): void {
    if (this.selectedType === 'Beneficiary Randomization Enrollment Template') {
      // Mock data for demonstration
      this.beneficiaryData = [
        {
          id: 1,
          householdNumber: 'HH-001',
          interestedInParticipating: 'Yes',
          survivesTargeting: 'Yes',
          treatmentArm: 'Control',
          hhEnrollmentStatus: 'Enrolled',
          groupName: 'Group A',
          enrolledMemberId: 'M-101',
          reasonForWhyNotEnrolled: '-',
          nomineeName: 'John Doe',
        },
      ];
      this.showBeneficiaryTable = true;
    } else {
      this.showBeneficiaryTable = false;
      this.beneficiaryData = [];
    }
  }

  resetFilters(): void {
    this.selectedType = '';
    this.selectedFile = null;
    this.showBeneficiaryTable = false;
    this.beneficiaryData = [];
  }
}
