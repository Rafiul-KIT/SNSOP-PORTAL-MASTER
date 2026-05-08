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

interface TemplateUploadResponse {
  code?: number | string | null;
  message?: string | null;
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
      const data = res?.data;

      if (!this.isApiSuccess(data)) {
        throw new Error(data?.message || 'Unable to upload template.');
      }

      this.msg.add({
        severity: 'success',
        summary: 'Imported',
        detail: data?.message || 'Template imported successfully.',
      });

      this.selectedFile = null;
      if (this.fileInput?.nativeElement) {
        this.fileInput.nativeElement.value = '';
      }
    } catch (err) {
      console.error('Failed to import template', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to import template.',
      });
    } finally {
      this.isUploading = false;
      this.cdr.detectChanges();
    }
  }

  resetFilters(): void {
    this.selectedType = '';
    this.selectedFile = null;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    this.showBeneficiaryTable = false;
    this.beneficiaryData = [];
  }

  private isApiSuccess(data: TemplateUploadResponse | null | undefined, fallback = false): boolean {
    if (!data) return fallback;
    if (data.code === undefined || data.code === null || data.code === '') return fallback;
    const code = Number(data.code);
    return code === 0 || code === 200;
  }
}
