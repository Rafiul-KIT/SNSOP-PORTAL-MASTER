import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface EconOpSummary {
  totalGroups: number;
  vlsaFormedGroups: number;
  groupMembers: number;
  enrolledBeneficiaries: number;
  treatmentBeneficiaries: number;
  controlBeneficiaries: number;
  courses: number;
  classesHeld: number;
  attendanceRecords: number;
  attendanceRate: number;
  businessPlans: number;
  approvedBusinessPlans: number;
  livelihoodGrantBeneficiaries: number;
  livelihoodGrantAmount: number;
  financialServiceConnectedBeneficiaries: number;
  depositAccountOpenedBeneficiaries: number;
}

export interface EnrollmentFunnel {
  stage: string;
  count: number;
  percentageOfEnrollment: number;
}

export interface LabelPercentage {
  label: string;
  count: number;
  percentage: number;
}

export interface EnrollmentData {
  totalEnrollmentRecords: number;
  funnel: EnrollmentFunnel[];
  participationStatus: LabelPercentage[];
  targetingStatus: LabelPercentage[];
  treatmentArm: LabelPercentage[];
  enrollmentStatus: LabelPercentage[];
  gender: LabelPercentage[];
  ageGroups: LabelPercentage[];
}

export interface GeoCoverage {
  stateId: number;
  stateName: string;
  countyId: number;
  countyName: string;
  enrolledBeneficiaries: number;
  groups: number;
  grantBeneficiaries: number;
  grantAmount: number;
  financialServiceConnectedBeneficiaries: number;
}

export interface GroupPerformance {
  groupId: number;
  groupName: string;
  vlsaFormed: boolean;
  latitude: number;
  longitude: number;
  groupMembers: number;
  enrolledBeneficiaries: number;
  treatmentBeneficiaries: number;
  attendanceRecords: number;
  presentAttendanceRecords: number;
  attendanceRate: number;
  approvedBusinessPlans: number;
  grantBeneficiaries: number;
  grantAmount: number;
  financialServiceConnectedBeneficiaries: number;
}

export interface TrainingOverview {
  totalCourses: number;
  scheduledClasses: number;
  attendanceRecords: number;
  presentRecords: number;
  absentRecords: number;
  participants: number;
  attendanceRate: number;
}

export interface CourseData {
  courseId: number;
  courseCode: string;
  courseName: string;
  scheduledClasses: number;
  participants: number;
  attendanceRecords: number;
  presentRecords: number;
  absentRecords: number;
  attendanceRate: number;
}

export interface TrainingData {
  overview: TrainingOverview;
  courses: CourseData[];
}

export interface BusinessPlansData {
  totalPlans: number;
  plansSubmitted: number;
  plansScreened: number;
  plansApproved: number;
  plansRejected: number;
  submissionRate: number;
  approvalRate: number;
  businessTypes: LabelPercentage[];
}

export interface PaymentCycle {
  paymentCycle: number;
  beneficiaries: number;
  plannedPayments: number;
  paidPayments: number;
  totalAmount: number;
  paidAmount: number;
}

export interface LivelihoodGrantsData {
  beneficiaries: number;
  plannedPayments: number;
  paidPayments: number;
  totalAmount: number;
  paidAmount: number;
  cycles: PaymentCycle[];
}

export interface FinancialLinkageData {
  totalRecords: number;
  connectedToFinancialService: number;
  depositAccountOpened: number;
  activeInLast90Days: number;
  connectionRate: number;
  depositAccountRate: number;
  financialServices: LabelPercentage[];
}

export interface EconOpDashboardData {
  generatedAt: string;
  summary: EconOpSummary;
  enrollment: EnrollmentData;
  geoCoverage: GeoCoverage[];
  groupPerformance: GroupPerformance[];
  training: TrainingData;
  businessPlans: BusinessPlansData;
  livelihoodGrants: LivelihoodGrantsData;
  financialLinkage: FinancialLinkageData;
}

@Injectable({
  providedIn: 'root',
})
export class EconomicOpportunitiesService {
  private readonly endpoint = '/api/econ-op/dashboard';

  constructor(private api: ApiService) {}

  async getDashboardData(): Promise<EconOpDashboardData | null> {
    try {
      const res = await this.api.GET<EconOpDashboardData>(this.endpoint);
      return res.data || null;
    } catch (error) {
      console.error('Error fetching Economic Opportunities Dashboard data:', error);
      return null;
    }
  }
}
