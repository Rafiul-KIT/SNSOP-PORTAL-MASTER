import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-survey-cto-dashboard',
  imports: [CommonModule, ChartModule],
  templateUrl: './survey-cto-dashboard.html',
  styleUrl: './survey-cto-dashboard.scss'
})
export class SurveyCtoDashboard implements OnInit {

  totalBeneficiaries: number = 0;
  totalHouseholds: number = 0;
  statesCovered: number = 0;
  countiesCovered: number = 0;
  averageAge: number = 0;
  literacyRate: number = 0;

  supportTypeData: any;
  supportTypeOptions: any;

  registrationPhaseData: any;
  registrationPhaseOptions: any;

  genderData: any;
  genderOptions: any;

  maritalStatusData: any;
  maritalStatusOptions: any;

  beneficiariesByStateData: any;
  beneficiariesByStateOptions: any;

  beneficiariesByCountyData: any;
  beneficiariesByCountyOptions: any;

  latestImports: any[] = [];

  ngOnInit() {
    // TODO: Replace with actual data from API
    this.totalBeneficiaries = 12500;
    this.totalHouseholds = 8500;
    this.statesCovered = 10;
    this.countiesCovered = 78;
    this.averageAge = 35;
    this.literacyRate = 75;

    this.supportTypeData = {
      labels: ['LIPW', 'DIS'],
      datasets: [
        {
          data: [8000, 4500],
          backgroundColor: ['#42A5F5', '#FFA726'],
          hoverBackgroundColor: ['#64B5F6', '#FFB74D']
        }
      ]
    };

    this.supportTypeOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    };

    this.registrationPhaseData = {
      labels: ['AF (Additional Financing)', 'PP (Parent Project)'],
      datasets: [
        {
          data: [6500, 6000],
          backgroundColor: ['#66BB6A', '#EF5350'],
          hoverBackgroundColor: ['#81C784', '#E57373']
        }
      ]
    };

    this.registrationPhaseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    };

    this.genderData = {
        labels: ['Male', 'Female', 'Other'],
        datasets: [
            {
                data: [5500, 6500, 500],
                backgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56"
                ],
                hoverBackgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56"
                ]
            }]
    };

    this.genderOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            }
        }
    };

    this.maritalStatusData = {
        labels: ['Single', 'Married', 'Divorced', 'Widowed'],
        datasets: [
            {
                data: [3000, 7000, 1000, 1500],
                backgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56",
                    "#4BC0C0"
                ],
                hoverBackgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56",
                    "#4BC0C0"
                ]
            }]
    };

    this.maritalStatusOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            }
        }
    };

    this.beneficiariesByCountyData = {
      labels: ['RENK', 'MANYO', 'FASHODA', 'MELUTH', 'MABAN', 'MAIWUT', 'LUAKPINY', 'LONGOCHUK', 'ULANG', 'BAILIET', 'MALAKAL', 'PANYIKANG', 'FANGAK', 'KHORFLUS', 'AYOD', 'DUK', 'UROR', 'NYIROL', 'AKOBO', 'TWIC EAST'],
      datasets: [
        {
          label: 'Beneficiaries',
          backgroundColor: '#42A5F5',
          data: [800, 1000, 700, 1500, 900, 400, 750, 1000, 1100, 850, 1200, 1300, 600, 950, 1400, 700, 1050, 800, 1150, 900]
        }
      ]
    };

    this.beneficiariesByCountyOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    };

    this.latestImports = [
      { fileName: 'import-2024-01-15.csv', status: 'Success', rowsProcessed: 500, errors: 0 },
      { fileName: 'import-2024-01-14.csv', status: 'Failed', rowsProcessed: 100, errors: 5 },
      { fileName: 'import-2024-01-13.csv', status: 'Success', rowsProcessed: 1200, errors: 0 },
      { fileName: 'import-2024-01-12.csv', status: 'Success', rowsProcessed: 800, errors: 0 },
    ];
  }
}
