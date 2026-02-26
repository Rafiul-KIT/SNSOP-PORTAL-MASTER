import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ApiService } from '../../../services/api.service';
import { Loader } from '../../components/loader/loader';

@Component({
  selector: 'app-survey-cto-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, Loader],
  templateUrl: './survey-cto-dashboard.html',
  styleUrl: './survey-cto-dashboard.scss'
})
export class SurveyCtoDashboard implements OnInit {
  isLoading = false;

  totalBeneficiaries: number = 0;
  totalHouseholds: number = 0;
  statesCovered: number = 0;
  countiesCovered: number = 0;
  averageAge: string = '0';
  literacyRate: number = 0;

  numRevisitBoma: number = 0;
  numRevisitBeneficiary: number = 0;
  alternateNomineeChanges: number = 0;
  missingPaymentCount: number = 0;

  supportTypeData: any;
  supportTypeOptions: any;

  registrationPhaseData: any;
  registrationPhaseOptions: any;

  genderData: any;
  genderOptions: any;

  maritalStatusData: any;
  maritalStatusOptions: any;

  beneficiariesByCountyData: any;
  beneficiariesByCountyOptions: any;

  latestImports: any[] = [];

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initChartOptions();
    this.fetchDashboardData();
  }

  fetchDashboardData() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.apiService.GET('api/surveycto-dashboard/all')
      .then(response => {
        const data = response.data;
        if (data) {
          this.totalBeneficiaries = data.totalActiveBeneficiary || 0;
          this.totalHouseholds = data.totalNumberOfHousehold || 0;
          this.statesCovered = data.totalStateCovered || 0;
          this.countiesCovered = data.totalCountyCovered || 0;
          this.averageAge = data.averageAge ? data.averageAge.toFixed(2) : '0';
          this.literacyRate = data.literacyPercentage || 0;

          this.numRevisitBoma = data.totalNumberOfRevisitBoma || 0;
          this.numRevisitBeneficiary = data.totalNumberOfRevisitBeneficiary || 0;
          // Placeholder for fields not currently in API
          this.alternateNomineeChanges = 0;
          this.missingPaymentCount = 0;

          this.setupCharts(data);
          this.latestImports = (data.latestListOfFileName || []).map((name: string) => ({
            fileName: name,
            status: 'Imported',
            rowsProcessed: '-',
            errors: '-'
          }));
        }
      })
      .catch(error => {
        console.error('Error fetching dashboard data:', error);
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  setupCharts(data: any) {
    // Support Type
    if (data.totalSupportType) {
      this.supportTypeData = {
        labels: Object.keys(data.totalSupportType),
        datasets: [{
          data: Object.values(data.totalSupportType),
          backgroundColor: ['#42A5F5', '#FFA726', '#66BB6A'],
          hoverBackgroundColor: ['#64B5F6', '#FFB74D', '#81C784']
        }]
      };
    }

    // Registration Phase
    if (data.totalRegistrationPhase) {
      this.registrationPhaseData = {
        labels: Object.keys(data.totalRegistrationPhase),
        datasets: [{
          data: Object.values(data.totalRegistrationPhase),
          backgroundColor: ['#66BB6A', '#EF5350', '#42A5F5'],
          hoverBackgroundColor: ['#81C784', '#E57373', '#64B5F6']
        }]
      };
    }

    // Gender
    if (data.totalGender) {
      this.genderData = {
        labels: Object.keys(data.totalGender),
        datasets: [{
          data: Object.values(data.totalGender),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"]
        }]
      };
    }

    // Marital Status
    if (data.totalMaritalStatus) {
      this.maritalStatusData = {
        labels: Object.keys(data.totalMaritalStatus),
        datasets: [{
          data: Object.values(data.totalMaritalStatus),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
          hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]
        }]
      };
    }

    // Beneficiaries by County
    if (data.countBeneficiaryByCounty) {
      this.beneficiariesByCountyData = {
        labels: data.countBeneficiaryByCounty.map((c: any) => c.countyName || `ID: ${c.countyId}`),
        datasets: [{
          label: 'Beneficiaries',
          backgroundColor: '#42A5F5',
          data: data.countBeneficiaryByCounty.map((c: any) => c.beneficiaryCount)
        }]
      };
    }
  }

  initChartOptions() {
    const commonPieOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    };

    this.supportTypeOptions = commonPieOptions;
    this.registrationPhaseOptions = commonPieOptions;
    this.genderOptions = commonPieOptions;
    this.maritalStatusOptions = commonPieOptions;

    this.beneficiariesByCountyOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { display: false }
      }
    };
  }
}
