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
    InputText,
    FloatLabel,
    Select,
  ],
  providers: [MessageService],
})
export class CashTransferSummary implements OnInit {
  isLoading = false;
  transfers: any[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  // Lookup data
  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];

  statusOptions = [
    { label: 'Active', value: 1 },
    { label: 'Inactive', value: 0 },
  ];

  paidStatusOptions = [
    { label: 'Paid', value: 'Paid' },
    { label: 'Unpaid', value: 'Unpaid' },
  ];

  // Filters
  filters: any = {
    stateId: null,
    countyId: null,
    payamId: null,
    bomaId: null,
    paymentCycle: null,
    status: null,
    paidStatus: null,
  };

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

      const res = await this.api.GET('/api/monitoring/cashTransfer', params);
      const data = res?.data ?? {};

      this.transfers = Array.isArray(data.data) ? data.data : [];
      this.totalRecords = data.count ?? 0;
    } catch (err) {
      console.error('Failed to load cash transfers', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load cash transfer data.',
      });
      this.transfers = [];
      this.totalRecords = 0;
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
    };
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.transfers = [];
    this.totalRecords = 0;
    this.currentPage = 0;
  }
}
