import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EconomicOpportunitiesService, EconOpDashboardData } from '../../../../services/economic-opportunities.service';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { Tabs, Tab, TabList, TabPanels, TabPanel } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextModule } from 'primeng/inputtext';
import { LoadingService } from '../../../../services/loading.service';

@Component({
  selector: 'app-economic-opportunities-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    TableModule,
    ChartModule,
    ProgressBarModule,
    Tabs,
    Tab,
    TabList,
    TabPanels,
    TabPanel,
    TagModule,
    SkeletonModule,
    InputTextModule
  ],
  templateUrl: './economic-opportunities-dashboard.html',
  styleUrl: './economic-opportunities-dashboard.scss',
})
export class EconomicOpportunitiesDashboard implements OnInit {
  dashboardData = signal<EconOpDashboardData | null>(null);
  loading = signal<boolean>(true);

  // Chart options and data
  enrollmentFunnelData: any;
  enrollmentFunnelOptions: any;

  businessTypeData: any;
  businessTypeOptions: any;

  financialServiceData: any;
  financialServiceOptions: any;

  constructor(
    private econOpService: EconomicOpportunitiesService,
    private loadingService: LoadingService
  ) {}

  async ngOnInit() {
    this.fetchData();
  }

  async fetchData() {
    this.loading.set(true);
    // this.loadingService.show(); // Optional: use global loading
    const data = await this.econOpService.getDashboardData();
    if (data) {
      this.dashboardData.set(data);
      this.prepareCharts(data);
    }
    this.loading.set(false);
    // this.loadingService.hide();
  }

  prepareCharts(data: EconOpDashboardData) {
    // 1. Enrollment Funnel (Horizontal Bar or Funnel-like Chart)
    const funnelLabels = data.enrollment.funnel.map(f => f.stage);
    const funnelCounts = data.enrollment.funnel.map(f => f.count);

    this.enrollmentFunnelData = {
      labels: funnelLabels,
      datasets: [
        {
          label: 'Beneficiaries',
          backgroundColor: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
          data: funnelCounts
        }
      ]
    };

    this.enrollmentFunnelOptions = {
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Enrollment Funnel' }
      },
      scales: {
        x: { beginAtZero: true }
      }
    };

    // 2. Business Types Pie Chart
    this.businessTypeData = {
      labels: data.businessPlans.businessTypes.map(t => t.label),
      datasets: [
        {
          data: data.businessPlans.businessTypes.map(t => t.count),
          backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']
        }
      ]
    };

    this.businessTypeOptions = {
      plugins: {
        legend: { position: 'bottom' }
      }
    };

    // 3. Financial Services Pie Chart
    this.financialServiceData = {
      labels: data.financialLinkage.financialServices.map(s => s.label),
      datasets: [
        {
          data: data.financialLinkage.financialServices.map(s => s.count),
          backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#6366F1']
        }
      ]
    };

    this.financialServiceOptions = {
      plugins: {
        legend: { position: 'bottom' }
      }
    };
  }

  formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  getAttendanceSeverity(rate: number) {
    if (rate >= 0.8) return 'success';
    if (rate >= 0.5) return 'warning';
    return 'danger';
  }
}
