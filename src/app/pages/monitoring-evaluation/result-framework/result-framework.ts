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

  get genderOptions() { return this.lookupService.genderOptions; }
  get legalStatusOptions() { return this.lookupService.legalStatusOptions; }
  get selectionCriteriaOptions() { return this.lookupService.selectionCriteriaOptions; }
  get paymentCycleOptions() { return this.lookupService.paymentCycleOptions; }
  get indicatorTypeOptions() { return this.lookupService.indicatorTypeOptions; }
  get ageRangeOptions() { return this.lookupService.ageRangeOptions; }
  get grievanceCategoryOptions() { return this.lookupService.grievanceCategoryOptions; }

  indicatorOptions: any[] = [];

  get selectedIndicatorLabel(): string {
    if (!this.filters.indicatorId) {
      return '--';
    }

    return this.lookupService.getIndicatorLabelByValue(this.filters.indicatorId);
  }

  // Conditional filter visibility based on selected indicator
  showSex = false;
  showAgeRange = false;
  showSupportType = false;
  showLegalStatus = false;
  showPaymentCycle = false;
  showGrievanceCategory = false;

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
      ? this.lookupService.getIndicatorsByType(this.filters.indicatorType)
      : [];
    this.hideAllFilterFields();
    this.clearConditionalFilters();
  }

  onIndicatorChange(): void {
    this.hideAllFilterFields();
    this.clearConditionalFilters();

    const id = this.filters.indicatorId;
    if (!id) return;

    switch (id) {
      case 1:
      case 10:
        this.showSex = true;
        this.showAgeRange = true;
        this.showSupportType = true;
        break;
      case 2:
      case 3:
      case 4:
        this.showAgeRange = true;
        this.showSupportType = true;
        break;
      case 5:
      case 6:
        this.showSupportType = true;
        break;
      case 8:
        this.showSex = true;
        this.showSupportType = true;
        break;
      case 9:
      case 14:
      case 15:
        this.showSex = true;
        this.showAgeRange = true;
        break;
      case 11:
        this.showPaymentCycle = true;
        this.showAgeRange = true;
        this.showSex = true;
        break;
      case 12:
      case 19:
        break;
      case 13:
        this.showAgeRange = true;
        this.showSex = true;
        this.showLegalStatus = true;
        break;
      case 16:
        this.showSex = true;
        break;
      case 17:
        this.showSex = true;
        this.showPaymentCycle = true;
        break;
      case 20:
      case 22:
        this.showSex = true;
        this.showLegalStatus = true;
        break;
      case 21:
      case 23:
        this.showLegalStatus = true;
        break;
      case 24:
        this.showGrievanceCategory = true;
        break;
    }
  }

  private hideAllFilterFields(): void {
    this.showSex = false;
    this.showAgeRange = false;
    this.showSupportType = false;
    this.showLegalStatus = false;
    this.showPaymentCycle = false;
    this.showGrievanceCategory = false;
  }

  private clearConditionalFilters(): void {
    this.filters.sex = null;
    this.filters.ageRange = null;
    this.filters.supportType = null;
    this.filters.legalStatus = null;
    this.filters.paymentCycle = null;
    this.filters.grievanceCategory = null;
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
    this.hideAllFilterFields();
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
