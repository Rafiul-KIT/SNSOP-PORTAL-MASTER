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
  selector: 'app-beneficiary-enrolment-summary',
  standalone: true,
  templateUrl: './beneficiary-enrolment-summary.html',
  styleUrls: ['./beneficiary-enrolment-summary.scss'],
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
export class BeneficiaryEnrolmentSummary implements OnInit {
  isLoading = false;
  beneficiaries: any[] = [];

  // Pagination
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  // Lookup data
  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];

  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
  ];

  selectionCriteriaOptions = [
    { label: 'PMT', value: 'PMT' },
    { label: 'Community Based', value: 'Community Based' },
  ];

  // Filters
  filters: any = {
    stateId: null,
    countyId: null,
    payamId: null,
    bomaId: null,
    age: null,
    gender: null,
    selectionCriteria: null,
  };

  // Breadcrumb
  home = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items = [
    { label: 'Monitoring & Evaluation' },
    { label: 'Beneficiary Enrolment Summary', icon: 'fas fa-clipboard-list' },
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
    try {
      this.isLoading = true;
      this.currentPage = 0;
      this.cdr.detectChanges();

      await this.loadBeneficiaries();
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadBeneficiaries(): Promise<void> {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const params: any = {
        page: this.currentPage,
        pageSize: this.pageSize,
      };

      if (this.filters.stateId) params.stateId = this.filters.stateId;
      if (this.filters.countyId) params.countyId = this.filters.countyId;
      if (this.filters.payamId) params.payamId = this.filters.payamId;
      if (this.filters.bomaId) params.bomaId = this.filters.bomaId;
      if (this.filters.age) params.age = this.filters.age;
      if (this.filters.gender) params.gender = this.filters.gender;
      if (this.filters.selectionCriteria) params.selectionCriteria = this.filters.selectionCriteria;

      const res = await this.api.GET('/api/monitoring/beneficiariry/enrollment', params);
      const data = res?.data ?? {};

      this.beneficiaries = Array.isArray(data.data) ? data.data : [];
      this.totalRecords = data.totalRecords ?? 0;
    } catch (err) {
      console.error('Failed to load beneficiaries', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load beneficiary enrolment data.',
      });
      this.beneficiaries = [];
      this.totalRecords = 0;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadBeneficiaries();
  }

  resetFilters(): void {
    this.filters = {
      stateId: null,
      countyId: null,
      payamId: null,
      bomaId: null,
      age: null,
      gender: null,
      selectionCriteria: null,
    };
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.beneficiaries = [];
    this.totalRecords = 0;
    this.currentPage = 0;
  }
}
