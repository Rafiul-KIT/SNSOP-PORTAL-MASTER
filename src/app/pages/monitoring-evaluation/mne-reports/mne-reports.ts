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
  private readonly maxUploadFileSizeBytes = 25 * 1024 * 1024;
  readonly maxUploadFileSizeLabel = '25 MB';

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

  get selectedFileSizeLabel(): string {
    return this.uploadData.file ? this.formatFileSize(this.uploadData.file.size) : '0 MB';
  }

  get remainingUploadCapacityLabel(): string {
    const usedBytes = this.uploadData.file?.size ?? 0;
    return this.formatFileSize(Math.max(this.maxUploadFileSizeBytes - usedBytes, 0));
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.uploadData.file = null;
      return;
    }

    if (!this.isAllowedFileSize(file)) {
      this.uploadData.file = null;
      input.value = '';
      this.msg.add({
        severity: 'warn',
        summary: 'File Too Large',
        detail: 'Please select a file that is 25 MB or smaller.',
      });
      return;
    }

    this.uploadData.file = file;
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

    if (!this.isAllowedFileSize(this.uploadData.file)) {
      this.uploadData.file = null;
      const fileInput = document.getElementById('reportFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      this.msg.add({
        severity: 'warn',
        summary: 'File Too Large',
        detail: 'Please select a file that is 25 MB or smaller.',
      });
      return;
    }

    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const formData = new FormData();
      formData.append('file', this.uploadData.file);

      // reportType is sent as a query parameter
      const res = await this.api.POST('/api/monitoring/mne-reports/upload', formData, 'global', {
        params: { reportType: this.uploadData.fileType }
      });

      const responseData = res?.data ?? {};

      if (responseData.success === false) {
        this.msg.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: responseData.message || 'Unable to upload report.',
        });
        return;
      }

      this.msg.add({
        severity: 'success',
        summary: 'Success',
        detail: responseData.message || 'Report uploaded successfully.',
      });

      this.uploadData = { fileType: null, file: null };
      // Reset file input manually if needed
      const fileInput = document.getElementById('reportFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      this.loadReports();
    } catch (err: any) {
      console.error('Failed to upload report', err);
      
      const errorMessage = err?.response?.data?.message || 'Unable to upload report.';
      
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
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

      if (this.filters.fromDate) params.fromDate = this.formatDate(this.filters.fromDate);
      if (this.filters.toDate) params.toDate = this.formatDate(this.filters.toDate);
      if (this.filters.fileType) params.reportType = this.filters.fileType;

      const res = await this.api.GET('/api/monitoring/mne-reports', params);
      
      const responseBody: any = res?.data ?? res ?? {};
      
      // More robust mapping for different possible response structures
      if (Array.isArray(responseBody.data)) {
        this.reports = responseBody.data;
      } else if (Array.isArray(responseBody.content)) {
        this.reports = responseBody.content;
      } else if (Array.isArray(responseBody)) {
        this.reports = responseBody;
      } else {
        this.reports = [];
      }

      // Handle pagination info robustly
      this.totalRecords = responseBody.pagination?.totalElements ?? 
                          responseBody.totalElements ?? 
                          responseBody.count ?? 
                          this.reports.length;

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

      const res = await this.api.GET(`/api/monitoring/mne-reports/${report.id}/download`, {}, 'global', { responseType: 'blob' });

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

  async permanentDeleteReport(report: any): Promise<void> {
    if (!confirm('Are you sure you want to permanently delete this report? This action cannot be undone.')) return;

    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      await this.api.DELETE(`/api/monitoring/mne-reports/${report.id}/permanent`);

      this.msg.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Report permanently deleted successfully.',
      });

      this.loadReports();
    } catch (err) {
      console.error('Failed to permanently delete report', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to permanently delete report.',
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async restoreReport(report: any): Promise<void> {
    if (!confirm('Are you sure you want to restore this report?')) return;

    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      await this.api.PUT(`/api/monitoring/mne-reports/${report.id}/restore`);

      this.msg.add({
        severity: 'success',
        summary: 'Restored',
        detail: 'Report restored successfully.',
      });

      this.loadReports();
    } catch (err) {
      console.error('Failed to restore report', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to restore report.',
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

  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private isAllowedFileSize(file: File): boolean {
    return file.size <= this.maxUploadFileSizeBytes;
  }

  private formatFileSize(bytes: number): string {
    if (bytes <= 0) return '0 MB';

    const megabytes = bytes / (1024 * 1024);
    return `${megabytes.toFixed(2)} MB`;
  }
}
