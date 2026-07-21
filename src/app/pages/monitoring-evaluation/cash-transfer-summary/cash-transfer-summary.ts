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
import { LookupService, IdName } from '../../../../services/lookup.service';
import { Paginator } from 'primeng/paginator';
import { InputText } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-cash-transfer-summary',
  standalone: true,
  templateUrl: './cash-transfer-summary.html',
  styleUrls: ['./cash-transfer-summary.scss'],
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
    TooltipModule,
  ],
  providers: [MessageService],
})
export class CashTransferSummary implements OnInit {
  isLoading = false;
  transfers: any[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;
  totalPaidBeneficiary = 0;
  totalUnpaidBeneficiary = 0;
  totalPaidAmountUSD = 0;

  // Lookup data
  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];

  get statusOptions() { return this.lookupService.wageRequestStatusOptions; }
  get paidStatusOptions() { return this.lookupService.paidStatusOptions; }
  get paymentCycleOptions() { return this.lookupService.paymentCycleOptions; }
  selectionCriteriaOptions = [
    { label: 'ALL', value: 'ALL' },
    { label: 'LIPW', value: 'LIPW' },
    { label: 'DIS', value: 'DIS' },
  ];

  reportFormatOptions = [
    { label: 'PDF', value: 'PDF' },
    { label: 'Excel', value: 'EXCEL' },
  ];
  selectedReportFormat: string = 'PDF';

  // Filters
  filters: any = {
    stateId: null,
    countyId: null,
    payamId: null,
    bomaId: null,
    paymentCycle: null,
    status: null,
    paidStatus: null,
    selectionCriteria: 'ALL',
  };

  get canDownload(): boolean {
    return !!this.filters.stateId && !!this.filters.countyId;
  }

  // Breadcrumb
  home = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items = [
    { label: 'Monitoring & Evaluation' },
    { label: 'Cash Transfer Summary', icon: 'fas fa-money-bill-wave' },
  ];

  constructor(
    private api: ApiService,
    private lookupService: LookupService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    this.loadStates();
    this.search();
  }

  async loadStates(): Promise<void> {
    try {
      this.states = await this.lookupService.getStateList();
    } catch (err) {
      console.error('Failed to load states', err);
    }
  }

  async onStateChange(): Promise<void> {
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.filters.countyId = null;
    this.filters.payamId = null;
    this.filters.bomaId = null;

    if (this.filters.stateId) {
      try {
        this.counties = await this.lookupService.getCountyListByStateId(this.filters.stateId);
      } catch (err) {
        console.error('Failed to load counties', err);
      }
    }
  }

  async onCountyChange(): Promise<void> {
    this.payams = [];
    this.bomas = [];
    this.filters.payamId = null;
    this.filters.bomaId = null;

    if (this.filters.countyId) {
      try {
        this.payams = await this.lookupService.getPayamListByCountyId(this.filters.countyId);
      } catch (err) {
        console.error('Failed to load payams', err);
      }
    }
  }

  async onPayamChange(): Promise<void> {
    this.bomas = [];
    this.filters.bomaId = null;

    if (this.filters.payamId) {
      try {
        this.bomas = await this.lookupService.getBomaListByPayamId(this.filters.payamId);
      } catch (err) {
        console.error('Failed to load bomas', err);
      }
    }
  }

  async search(): Promise<void> {
    this.currentPage = 0;
    await this.loadTransfers();
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadTransfers();
  }

  async loadTransfers(): Promise<void> {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const params: any = {
        page: this.currentPage,
        size: this.pageSize,
      };

      if (this.filters.stateId) params.stateId = this.filters.stateId;
      if (this.filters.countyId) params.countyId = this.filters.countyId;
      if (this.filters.payamId) params.payamId = this.filters.payamId;
      if (this.filters.bomaId) params.bomaId = this.filters.bomaId;
      if (this.filters.paymentCycle) params.paymentCycle = this.filters.paymentCycle;
      if (this.filters.status != null) params.status = this.filters.status;
      if (this.filters.paidStatus) params.paidStatus = this.filters.paidStatus;
      if (this.filters.selectionCriteria && this.filters.selectionCriteria !== 'ALL') {
        params.selectionCriteria = this.filters.selectionCriteria;
      }

      const res = await this.api.GET('/api/monitoring/cashTransfer', params);
      const data = res?.data ?? {};
      const summary = data.summary ?? {};

      this.transfers = Array.isArray(data.content) ? data.content : [];
      this.totalRecords = data.totalElements ?? 0;
      this.totalPaidBeneficiary = summary.totalPaidBeneficiaries ?? 0;
      this.totalUnpaidBeneficiary = summary.totalUnpaidBeneficiaries ?? 0;
      this.totalPaidAmountUSD = summary.totalPaidAmountUSD ?? 0;
    } catch (err) {
      console.error('Failed to load cash transfers', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load cash transfer data.',
      });
      this.transfers = [];
      this.totalRecords = 0;
      this.totalPaidBeneficiary = 0;
      this.totalUnpaidBeneficiary = 0;
      this.totalPaidAmountUSD = 0;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async download(): Promise<void> {
    if (!this.canDownload) {
      this.msg.add({
        severity: 'warn',
        summary: 'Required Filters',
        detail: 'Please select both State and County before downloading the report.',
      });
      return;
    }

    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const payload: any = {
        reportFormat: this.selectedReportFormat,
      };

      if (this.filters.stateId) payload.stateId = this.filters.stateId;
      if (this.filters.countyId) payload.countyId = this.filters.countyId;
      if (this.filters.payamId) payload.payamId = this.filters.payamId;
      if (this.filters.bomaId) payload.bomaId = this.filters.bomaId;
      if (this.filters.paymentCycle) payload.paymentCycle = this.filters.paymentCycle;
      if (this.filters.status != null) payload.status = this.filters.status;
      if (this.filters.paidStatus) payload.paidStatus = this.filters.paidStatus;
      if (this.filters.selectionCriteria && this.filters.selectionCriteria !== 'ALL') {
        payload.selectionCriteria = this.filters.selectionCriteria;
      }

      const res = await this.api.POST(
        '/api/monitoring/cashTransfer/download',
        payload,
        'global',
        { responseType: 'blob' }
      );

      const blob = new Blob([res.data], {
        type: this.selectedReportFormat === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const ext = this.selectedReportFormat === 'PDF' ? 'pdf' : 'xlsx';
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Cash_Transfer_Summary.${ext}`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.msg.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Report downloaded successfully.',
      });
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

  resetFilters(): void {
    this.filters = {
      stateId: null,
      countyId: null,
      payamId: null,
      bomaId: null,
      paymentCycle: null,
      status: null,
      paidStatus: null,
      selectionCriteria: 'ALL',
    };
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.transfers = [];
    this.totalRecords = 0;
    this.currentPage = 0;
    this.totalPaidBeneficiary = 0;
    this.totalUnpaidBeneficiary = 0;
    this.totalPaidAmountUSD = 0;
  }
}
