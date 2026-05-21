import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { MenuItem, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../../services/api.service';
import { EconomicOpportunitiesBeneficiaryRandomizationEnrollment } from '../beneficiary-randomization-enrollment/economic-opportunities-beneficiary-randomization-enrollment';
import Swal from 'sweetalert2';

interface TemplateUploadResponse {
  status?: string | null;
  message?: string | null;
  code?: number | string | null;
  totalRowsImported?: number;
  failedRows?: Record<string, string>;
}

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
    Toast,
    Loader,
    EconomicOpportunitiesBeneficiaryRandomizationEnrollment,
  ],
  providers: [MessageService],
  templateUrl: './economic-opportunities-template-upload.html',
  styleUrl: './economic-opportunities-template-upload.scss',
})
export class EconomicOpportunitiesTemplateUpload {
  private readonly uploadEndpoint = '/api/econ-op/template/upload';

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  selectedType = '';
  selectedFile: File | null = null;
  isUploading = false;
  showBeneficiaryTable = false;
  beneficiaryData: any[] = [];

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Template Upload', icon: 'fas fa-file-upload' },
  ];

  typeOptions = [
    { label: 'Household Group View Template', value: 'HOUSEHOLD_GROUP_VIEW' },
    { label: 'Beneficiary Randomization Enrollment Template', value: 'BENEFICIARY_RANDOMIZATION_ENROLLMENT' },
    { label: 'Course Entity Template', value: 'COURSE_ENTITY' },
    { label: 'Course Details Template', value: 'COURSE_DETAILS' },
    { label: 'Training Attendance Tracking Template', value: 'TRAINING_ATTENDANCE_TRACKING' },
    { label: 'Business Plan Development Template', value: 'BUSINESS_PLAN_DEVELOPMENT' },
    // { label: 'Coaching Entity Template', value: 'Coaching Entity Template' },
    // { label: 'Coaching Details Template', value: 'Coaching Details Template' },
    // { label: 'Coaching Session tracking Template', value: 'Coaching Session tracking Template' },
    { label: 'Livelihood Grant Disbursement Template', value: 'LIVELIHOOD_GRANT_DISBURSEMENT' },
    { label: 'Financial Service Linkage Tracking Template', value: 'FINANCIAL_SERVICE_LINKAGE_TRACKING' },
  ];

  constructor(
    private api: ApiService,
    private msg: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  onAnalyze(): void {
    console.log('Analyze clicked');
  }

  async onImport(): Promise<void> {
    if (!this.selectedType) {
      this.msg.add({
        severity: 'warn',
        summary: 'Template Type Required',
        detail: 'Please select a template type before importing.',
      });
      return;
    }

    if (!this.selectedFile) {
      this.msg.add({
        severity: 'warn',
        summary: 'File Required',
        detail: 'Please choose a file before importing.',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    try {
      this.isUploading = true;
      this.cdr.detectChanges();

      const endpoint = `${this.uploadEndpoint}?templateType=${encodeURIComponent(this.selectedType)}`;
      const res = await this.api.POST<TemplateUploadResponse>(endpoint, formData);
      this.handleResponse(res?.data);
    } catch (err: any) {
      console.error('Failed to import template', err);
      const errorData = err.response?.data;
      if (errorData && errorData.status) {
        this.handleResponse(errorData);
      } else {
        Swal.fire({
          title: 'Import Failed',
          text: err.message || 'An unexpected error occurred during import.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      }
    } finally {
      this.isUploading = false;
      this.cdr.detectChanges();
    }
  }

  private handleResponse(data: TemplateUploadResponse | null | undefined): void {
    if (!data) {
      throw new Error('No response from server');
    }

    if (this.isImportSuccess(data)) {
      Swal.fire({
        title: 'Import Successful',
        text: data.message || `Total rows imported: ${data.totalRowsImported}`,
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });
      this.resetFileOnly();
    } else if (this.isPartialImport(data) || this.isImportError(data)) {
      const isError = this.isImportError(data);
      let errorHtml = `<div style="text-align: left; max-height: 300px; overflow-y: auto;">
        <p>${data.message || (isError ? 'Validation failed' : 'Import completed with some errors.')}</p>
        <ul style="padding-left: 20px;">`;
      
      if (data.failedRows && Object.keys(data.failedRows).length > 0) {
        Object.entries(data.failedRows).forEach(([key, msg]) => {
          errorHtml += `<li><strong>${key}:</strong> ${msg}</li>`;
        });
      }
      
      errorHtml += `</ul></div>`;

      Swal.fire({
        title: isError ? 'Import Failed' : 'Partial Import',
        html: errorHtml,
        icon: isError ? 'error' : 'warning',
        confirmButtonColor: '#3085d6',
      });
      
      if (!isError) {
        this.resetFileOnly();
      }
    } else {
      throw new Error(data.message || 'Unable to upload template.');
    }
  }

  private isImportSuccess(data: TemplateUploadResponse): boolean {
    const status = String(data.status ?? '').trim().toLowerCase();
    const code = Number(data.code ?? data.status);
    const message = String(data.message ?? '').trim().toLowerCase();

    return (
      code === 200 ||
      status.startsWith('200') ||
      status === 'success' ||
      status === 'successful' ||
      message === 'import successful'
    );
  }

  private isPartialImport(data: TemplateUploadResponse): boolean {
    const status = String(data.status ?? '').trim();
    const code = Number(data.code ?? data.status);
    return code === 206 || status.startsWith('206');
  }

  private isImportError(data: TemplateUploadResponse): boolean {
    const status = String(data.status ?? '').trim();
    const code = Number(data.code ?? data.status);
    return code === 400 || status.startsWith('400');
  }

  private resetFileOnly(): void {
    this.selectedFile = null;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  resetFilters(): void {
    this.selectedType = '';
    this.resetFileOnly();
    this.showBeneficiaryTable = false;
    this.beneficiaryData = [];
  }
}
