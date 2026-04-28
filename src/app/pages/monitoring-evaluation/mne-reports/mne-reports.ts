import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../../services/api.service';
import { Paginator } from 'primeng/paginator';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-mne-reports',
  standalone: true,
  templateUrl: './mne-reports.html',
  styleUrls: ['./mne-reports.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbModule,
    TableModule,
    ButtonModule,
    Toast,
    Loader,
    Paginator,
    FloatLabel,
    Select,
    DatePicker,
    Tooltip
  ],
  providers: [MessageService],
})
export class MneReports implements OnInit {
  isLoading = false;
  reports: any[] = [];

  // Pagination
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  // Options
  fileTypes = [
    { label: 'Partner Monitoring', value: 'PARTNER_MONITORING' },
    { label: 'SPCU Monitoring', value: 'SPCU_MONITORING' },
    { label: 'Third Party Monitoring', value: 'THIRD_PARTY_MONITORING' },
    { label: 'Final Periodic', value: 'FINAL_PERIODIC' },
    { label: 'Evaluation', value: 'EVALUATION' },
  ];

  // Upload Form
  uploadData = {
    fileType: null,
    file: null as File | null
  };

  // Search Filters
  filters: {
    fromDate: Date | null,
    toDate: Date | null,
    fileType: string | null
  } = {
    fromDate: null,
    toDate: null,
    fileType: null
  };

  showingDeleted = false;

  // Breadcrumb
  home = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items = [
    { label: 'Monitoring & Evaluation' },
    { label: 'M&E Reports', icon: 'fas fa-file-alt' },
  ];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  onFileSelect(event: any): void {
    if (event.target.files.length > 0) {
      this.uploadData.file = event.target.files[0];
    }
  }

  async uploadReport(): Promise<void> {
    if (!this.uploadData.fileType || !this.uploadData.file) {
      this.msg.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please select a file type and a file to upload.',
      });
      return;
    }

    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const formData = new FormData();
      formData.append('file', this.uploadData.file);

      // reportType is sent as a query parameter
      await this.api.POST('/api/monitoring/mne-reports/upload', formData, 'global', {
        params: { reportType: this.uploadData.fileType }
      });

      this.msg.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Report uploaded successfully.',
      });

      this.uploadData = { fileType: null, file: null };
      // Reset file input manually if needed
      const fileInput = document.getElementById('reportFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      this.loadReports();
    } catch (err) {
      console.error('Failed to upload report', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to upload report.',
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async search(): Promise<void> {
    this.currentPage = 0;
    await this.loadReports();
  }

  async viewDeletedReports(): Promise<void> {
    this.showingDeleted = !this.showingDeleted;
    this.currentPage = 0;
    await this.loadReports();
  }

  async loadReports(): Promise<void> {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const params: any = {
        page: this.currentPage,
        size: this.pageSize,
        status: this.showingDeleted ? 'INACTIVE' : 'ACTIVE'
      };

      if (this.filters.fromDate) params.fromDate = this.filters.fromDate.toISOString();
      if (this.filters.toDate) params.toDate = this.filters.toDate.toISOString();
      if (this.filters.fileType) params.reportType = this.filters.fileType;

      const res = await this.api.GET('/api/monitoring/mne-reports', params);
      
      // Map based on the provided DynamicPagedResponse structure
      const responseBody: any = res.data ?? {};
      this.reports = Array.isArray(responseBody.data) ? responseBody.data : [];
      this.totalRecords = responseBody.pagination?.totalElements ?? 0;
    } catch (err) {
      console.error('Failed to load reports', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load report list.',
      });
      this.reports = [];
      this.totalRecords = 0;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadReports();
  }

  async downloadReport(report: any): Promise<void> {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const res = await this.api.GET(`/api/monitoring/mne-reports/download/${report.id}`, {}, 'global', { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', report.fileName || 'report');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Failed to download report', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to download report.',
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async deleteReport(report: any): Promise<void> {
    // Ideally use a confirmation dialog here
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      await this.api.DELETE(`/api/monitoring/mne-reports/${report.id}`);

      this.msg.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Report deleted successfully.',
      });

      this.loadReports();
    } catch (err) {
      console.error('Failed to delete report', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to delete report.',
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  resetFilters(): void {
    this.filters = {
      fromDate: null,
      toDate: null,
      fileType: null
    };
    this.search();
  }
}
