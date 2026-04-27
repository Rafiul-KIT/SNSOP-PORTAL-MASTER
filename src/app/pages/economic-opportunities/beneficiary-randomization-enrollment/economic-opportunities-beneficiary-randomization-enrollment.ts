import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-economic-opportunities-beneficiary-randomization-enrollment',
  standalone: true,
  imports: [CommonModule, TableModule],
  templateUrl: './economic-opportunities-beneficiary-randomization-enrollment.html',
  styleUrl: './economic-opportunities-beneficiary-randomization-enrollment.scss',
})
export class EconomicOpportunitiesBeneficiaryRandomizationEnrollment {
  @Input() data: any[] = [];

  cols = [
    { field: 'id', header: 'Id' },
    { field: 'householdNumber', header: 'Household Number' },
    { field: 'interestedInParticipating', header: 'Interested In Participating' },
    { field: 'survivesTargeting', header: 'Survives Targeting' },
    { field: 'treatmentArm', header: 'Treatment Arm' },
    { field: 'hhEnrollmentStatus', header: 'HH Enrollment Status' },
    { field: 'groupName', header: 'Group Name' },
    { field: 'enrolledMemberId', header: 'Enrolled Member ID' },
    { field: 'reasonForWhyNotEnrolled', header: 'Reason For Why Not Enrolled' },
    { field: 'nomineeName', header: 'Nominee Name' },
  ];
}
