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
import { InputText } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';

@Component({
  selector: 'app-result-framework',
  standalone: true,
  templateUrl: './result-framework.html',
  styleUrls: ['./result-framework.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbModule,
    TableModule,
    ButtonModule,
    Toast,
    Loader,
    InputText,
    FloatLabel,
    Select,
  ],
  providers: [MessageService],
})
export class ResultFramework implements OnInit {
  isLoading = false;
  results: any[] = [];
  totalRecords = 0;

  // Lookup data
  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];

  sexOptions = [
    { label: 'Male', value: 1 },
    { label: 'Female', value: 2 },
  ];

  legalStatusOptions = [
    { label: 'Refugee', value: 1 },
    { label: 'Host Community', value: 2 },
    { label: 'IDP', value: 3 },
  ];

  supportTypeOptions = [
    { label: 'Cash Transfer', value: 1 },
    { label: 'In-Kind', value: 2 },
  ];

  indicatorTypeOptions = [
    { label: 'Project Development Objective Indicators by Objectives/Outcomes', value: 1 },
    { label: 'Monitoring & Evaluation Plan: Intermediate Results Indicators', value: 2 },
  ];

  indicatorOptions: any[] = [];

  private indicatorsByType: Record<number, any[]> = {
    1: [
      { label: 'Beneficiaries of social safety net programs', value: 1 },
      { label: 'Beneficiaries of social safety net programs - Female', value: 2 },
      { label: 'Beneficiary households of social safety net programs- Refugees', value: 3 },
      { label: 'Beneficiary households of social safety net programs- Host Communities', value: 4 },
      { label: 'Beneficiary households of social safety net programs- Female Refugees (Number)', value: 5 },
      { label: 'Beneficiary households of social safety net programs- Female Host Communities (Number)', value: 6 },
      { label: 'Beneficiary and non-beneficiary households reporting satisfaction with community assets created through LIPW (Outside MIS-Survey)', value: 7 },
      { label: 'Beneficiary households receiving economic opportunities', value: 8 },
      { label: 'Eligible beneficiary households with functional income-generating investments four months after the receipt of the full economic opportunities package', value: 9 },
      { label: 'Percentage of beneficiaries paid using the enhanced integrated biometric and Management Information Systems', value: 10 },
    ],
    2: [
      { label: 'Number of beneficiary households receiving cash for performing labor intensive public works', value: 11 },
      { label: 'Number of beneficiaries receiving cash for performing labor intensive public works who are female', value: 12 },
      { label: 'Number of beneficiary households participating in all sessions of the in-depth Cash Plus training', value: 13 },
      { label: 'Number of beneficiary households participating in all the sessions of the in-depth Cash Plus training - refugees number', value: 14 },
      { label: 'Number of beneficiary households participating in all the sessions of the in-depth Cash Plus training - host communities', value: 15 },
      { label: 'Number of beneficiary households receiving cash transfer for participating in the behavioral change communication training', value: 16 },
      { label: 'Number of beneficiary households receiving Direct Income Support', value: 17 },
      { label: 'Percentage of Labor Intensive Public Works subprojects that mitigate climate-induced shocks', value: 18 },
      { label: 'Number of LIPW work days created', value: 19 },
      { label: 'Number of beneficiaries receiving cash for performing labor intensive public works who are refugees or host communities', value: 20 },
      { label: 'Number of beneficiary households receiving Direct Income Support who have a female primary beneficiary (Number)', value: 21 },
      { label: 'Number of beneficiaries receiving economic opportunities who are youth', value: 22 },
      { label: 'Number of beneficiaries receiving Economic Opportunities who are female youth', value: 23 },
      { label: 'Percentage of grievances resolved through the GRM', value: 24 },
      { label: 'Percentage of cash transfers to beneficiary households made on time', value: 25 },
      { label: 'Increased participation by women in community level governance and coordination structures', value: 26 },
      { label: 'Capacity Building Plan for Safety Net is implemented by the Ministry of Gender, Child and Social Welfare', value: 27 },
    ],
  };

  // Filters
  filters: any = {
    indicatorType: null,
    indicatorId: null,
    stateId: null,
    countyId: null,
    payamId: null,
    bomaId: null,
    legalStatus: null,
    supportType: null,
    sex: null,
    ageRange: null,
    paymentCycle: null,
    grievanceCategory: null,
  };

  // Breadcrumb
  home = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items = [
    { label: 'Monitoring & Evaluation' },
    { label: 'Result Framework', icon: 'fas fa-bullseye' },
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

  onIndicatorTypeChange(): void {
    this.filters.indicatorId = null;
    this.indicatorOptions = this.filters.indicatorType
      ? this.indicatorsByType[this.filters.indicatorType] || []
      : [];
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
    if (!this.filters.indicatorType) {
      this.msg.add({
        severity: 'warn',
        summary: 'Required',
        detail: 'Please select an Indicator Type.',
      });
      return;
    }
    if (!this.filters.indicatorId) {
      this.msg.add({
        severity: 'warn',
        summary: 'Required',
        detail: 'Please select an Indicator.',
      });
      return;
    }
    await this.loadResults();
  }

  async loadResults(): Promise<void> {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const params: any = {
        indicatorId: this.filters.indicatorId,
      };

      if (this.filters.stateId) params.stateId = this.filters.stateId;
      if (this.filters.countyId) params.countyId = this.filters.countyId;
      if (this.filters.payamId) params.payamId = this.filters.payamId;
      if (this.filters.bomaId) params.bomaId = this.filters.bomaId;
      if (this.filters.legalStatus != null) params.legalStatus = this.filters.legalStatus;
      if (this.filters.supportType != null) params.supportType = this.filters.supportType;
      if (this.filters.sex != null) params.sex = this.filters.sex;
      if (this.filters.ageRange) params.ageRange = this.filters.ageRange;
      if (this.filters.paymentCycle) params.paymentCycle = this.filters.paymentCycle;
      if (this.filters.grievanceCategory) params.grievanceCategory = this.filters.grievanceCategory;

      const res = await this.api.GET('/api/monitoring/indicator-results', params);
      const data = res?.data ?? {};

      this.results = Array.isArray(data.data) ? data.data : [];
      this.totalRecords = data.count ?? 0;
    } catch (err) {
      console.error('Failed to load indicator results', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load indicator results.',
      });
      this.results = [];
      this.totalRecords = 0;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  resetFilters(): void {
    this.indicatorOptions = [];
    this.filters = {
      indicatorType: null,
      indicatorId: null,
      stateId: null,
      countyId: null,
      payamId: null,
      bomaId: null,
      legalStatus: null,
      supportType: null,
      sex: null,
      ageRange: null,
      paymentCycle: null,
      grievanceCategory: null,
    };
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.results = [];
    this.totalRecords = 0;
  }
}
