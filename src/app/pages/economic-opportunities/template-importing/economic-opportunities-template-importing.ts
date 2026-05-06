import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { MenuItem, MessageService } from 'primeng/api';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { IdName, LookupService } from '../../../../services/lookup.service';
import { ApiService } from '../../../../services/api.service';

interface TemplateOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-economic-opportunities-template-importing',
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
  ],
  providers: [MessageService],
  templateUrl: './economic-opportunities-template-importing.html',
  styleUrl: './economic-opportunities-template-importing.scss',
})
export class EconomicOpportunitiesTemplateImporting implements OnInit {
  private readonly downloadEndpoint = '/api/econ-op/template/download';

  selectedTemplate: string | null = null;
  selectedState: string | number | null = null;
  selectedCounty: string | number | null = null;
  selectedPayam: string | number | null = null;
  selectedBoma: string | number | null = null;

  isDownloading = false;
  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];
  isLoadingStates = false;
  isLoadingCounties = false;
  isLoadingPayams = false;
  isLoadingBomas = false;

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Excel Template Download', icon: 'fas fa-file-download' },
  ];

  templateOptions: TemplateOption[] = [
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
    private lookupService: LookupService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    this.loadStates();
  }

  async loadStates(): Promise<void> {
    this.isLoadingStates = true;

    try {
      this.states = await this.lookupService.getStateList();
    } catch (err) {
      console.error('Failed to load states', err);
    } finally {
      this.isLoadingStates = false;
    }
  }

  async onStateChange(): Promise<void> {
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.selectedCounty = null;
    this.selectedPayam = null;
    this.selectedBoma = null;

    if (!this.selectedState) {
      return;
    }

    this.isLoadingCounties = true;

    try {
      this.counties = await this.lookupService.getCountyListByStateId(this.selectedState);
    } catch (err) {
      console.error('Failed to load counties', err);
    } finally {
      this.isLoadingCounties = false;
    }
  }

  async onCountyChange(): Promise<void> {
    this.payams = [];
    this.bomas = [];
    this.selectedPayam = null;
    this.selectedBoma = null;

    if (!this.selectedCounty) {
      return;
    }

    this.isLoadingPayams = true;

    try {
      this.payams = await this.lookupService.getPayamListByCountyId(this.selectedCounty);
    } catch (err) {
      console.error('Failed to load payams', err);
    } finally {
      this.isLoadingPayams = false;
    }
  }

  async onPayamChange(): Promise<void> {
    this.bomas = [];
    this.selectedBoma = null;

    if (!this.selectedPayam) {
      return;
    }

    this.isLoadingBomas = true;

    try {
      this.bomas = await this.lookupService.getBomaListByPayamId(this.selectedPayam);
    } catch (err) {
      console.error('Failed to load bomas', err);
    } finally {
      this.isLoadingBomas = false;
    }
  }

  async downloadTemplate(): Promise<void> {
    if (!this.selectedTemplate) {
      this.msg.add({
        severity: 'warn',
        summary: 'Template Required',
        detail: 'Please select a template before downloading.',
      });
      return;
    }

    const payload: Record<string, string | number> = {
      templateType: this.selectedTemplate,
    };

    if (this.selectedState) payload['stateId'] = Number(this.selectedState);
    if (this.selectedCounty) payload['countyId'] = Number(this.selectedCounty);
    if (this.selectedPayam) payload['payamId'] = Number(this.selectedPayam);
    if (this.selectedBoma) payload['bomaId'] = Number(this.selectedBoma);

    try {
      this.isDownloading = true;
      this.cdr.detectChanges();

      const res = await this.api.POST(
        this.downloadEndpoint,
        payload,
        'global',
        { responseType: 'blob' }
      );

      const contentType = res.headers?.['content-type'] || this.getExcelMimeType();
      const blob = new Blob([res.data], { type: contentType });
      const fileName =
        this.getFileNameFromHeaders(res.headers?.['content-disposition']) ||
        this.buildDefaultFileName(this.selectedTemplate);

      this.downloadBlob(blob, fileName);

      this.msg.add({
        severity: 'success',
        summary: 'Downloaded',
        detail: 'Template downloaded successfully.',
      });
    } catch (err) {
      console.error('Failed to download template', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to download template.',
      });
    } finally {
      this.isDownloading = false;
      this.cdr.detectChanges();
    }
  }

  resetFilters(): void {
    this.selectedTemplate = null;
    this.selectedState = null;
    this.selectedCounty = null;
    this.selectedPayam = null;
    this.selectedBoma = null;
    this.counties = [];
    this.payams = [];
    this.bomas = [];
  }

  private getFileNameFromHeaders(contentDisposition: string | undefined): string | null {
    if (!contentDisposition) return null;

    const utf8FileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8FileNameMatch?.[1]) {
      return decodeURIComponent(utf8FileNameMatch[1].trim());
    }

    const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    return fileNameMatch?.[1]?.trim() || null;
  }

  private buildDefaultFileName(templateType: string): string {
    return `${templateType.toLowerCase().replace(/_/g, '-')}-template.xlsx`;
  }

  private getExcelMimeType(): string {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
