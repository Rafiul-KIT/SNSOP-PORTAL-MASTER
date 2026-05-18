import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuItem, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Loader } from '../../../components/loader/loader';
import { IdName, LookupService } from '../../../../services/lookup.service';
import { ApiService } from '../../../../services/api.service';

interface GroupRecord {
  id: number;
  groupName: string;
  latitude: number;
  longitude: number;
  vlsaFormed: boolean;
}

interface GroupListResponse {
  code?: number | string | null;
  message?: string | null;
  content?: GroupRecord[] | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  totalElements?: number | null;
}

interface BeneficiaryGroupSearchPayload {
  stateId: number;
  countyId: number;
  payamId: number;
  bomaId: number;
  groupId: number;
}

interface BeneficiaryGroupSummary {
  id: number;
  beneficiaryId: number;
  applicationId: string;
  respondentFullName: string;
  respondentAge: number;
  respondentGender: string;
  groupId: number;
  groupName: string;
  vlsaFormed: boolean;
}

interface BeneficiaryGroupRow extends BeneficiaryGroupSummary {
  rowKey: string;
}

interface BeneficiaryGroupSearchResponse {
  code?: number | string | null;
  message?: string | null;
  beneficiaryGroupSummaryList?: BeneficiaryGroupSummary[] | null;
  total?: number | null;
}

interface BeneficiaryGroupAssignPayload {
  id: number | null;
  beneficiaryId: number;
  groupId: number;
}

interface BeneficiaryGroupAssignResponse {
  code?: number | string | null;
  message?: string | null;
}

@Component({
  selector: 'app-economic-opportunities-household-group-mapping',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbModule,
    ButtonModule,
    FloatLabel,
    Paginator,
    Select,
    TableModule,
    CheckboxModule,
    Toast,
    Loader,
  ],
  providers: [MessageService],
  templateUrl: './economic-opportunities-household-group-mapping.html',
  styleUrl: './economic-opportunities-household-group-mapping.scss',
})
export class EconomicOpportunitiesHouseholdGroupMapping implements OnInit {
  private readonly groupEndpoint = '/api/econ-op/group/get';
  private readonly beneficiaryGroupSearchEndpoint = '/api/econ-op/beneficiary-group/search';
  private readonly beneficiaryGroupAssignEndpoint = '/api/econ-op/beneficiary-groups/save-bulk';

  selectedState: string | number | null = null;
  selectedCounty: string | number | null = null;
  selectedPayam: string | number | null = null;
  selectedBoma: string | number | null = null;

  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];
  isLoadingStates = false;
  isLoadingCounties = false;
  isLoadingPayams = false;
  isLoadingBomas = false;
  isLoadingGroups = false;
  isLoadingBeneficiaries = false;
  isSearching = false;
  isAssigning = false;

  beneficiaries: BeneficiaryGroupRow[] = [];
  selectedBeneficiaries: BeneficiaryGroupRow[] = [];
  private readonly selectedBeneficiaryMap = new Map<string, BeneficiaryGroupRow>();
  selectedGroup: number | null = null;
  showTable = false;
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  groups: GroupRecord[] = [];

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Household And GroupId Mapping', icon: 'fas fa-users-cog' },
  ];

  constructor(
    private lookupService: LookupService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    this.loadStates();
    this.loadGroups();
  }

  get isBusy(): boolean {
    return (
      this.isLoadingGroups ||
      this.isLoadingBeneficiaries ||
      this.isSearching ||
      this.isAssigning
    );
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
    if (!this.selectedState) return;
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
    if (!this.selectedCounty) return;
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
    if (!this.selectedPayam) return;
    this.isLoadingBomas = true;
    try {
      this.bomas = await this.lookupService.getBomaListByPayamId(this.selectedPayam);
    } catch (err) {
      console.error('Failed to load bomas', err);
    } finally {
      this.isLoadingBomas = false;
    }
  }

  async loadGroups(): Promise<void> {
    this.isLoadingGroups = true;
    this.cdr.detectChanges();

    try {
      const res = await this.api.GET<GroupListResponse>(this.groupEndpoint, {
        pageNumber: 0,
        pageSize: 1000,
      });
      const data = res?.data;

      if (!this.isApiSuccess(data, Array.isArray(data?.content))) {
        throw new Error(data?.message || 'Unable to load groups');
      }

      const content = Array.isArray(data?.content) ? data.content : [];
      this.groups = content.map((item) => ({
        id: Number(item.id) || 0,
        groupName: item.groupName ?? '',
        latitude: Number(item.latitude) || 0,
        longitude: Number(item.longitude) || 0,
        vlsaFormed: !!item.vlsaFormed,
      }));
    } catch (err) {
      console.error('Failed to load groups', err);
      this.groups = [];
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load household groups.',
      });
    } finally {
      this.isLoadingGroups = false;
      this.cdr.detectChanges();
    }
  }

  async onSearch(): Promise<void> {
    if (!this.canSearch()) {
      this.msg.add({
        severity: 'warn',
        summary: 'Geo Fields Required',
        detail: 'Please select State, County, Payam, and Boma before searching.',
      });
      return;
    }

    this.currentPage = 0;
    this.pageSize = this.pageSize || 10;
    this.showTable = true;
    await this.loadBeneficiaries();
  }

  async onPageChange(event: PaginatorState): Promise<void> {
    this.currentPage = event.page ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    await this.loadBeneficiaries();
  }

  resetFilters(): void {
    this.selectedState = null;
    this.selectedCounty = null;
    this.selectedPayam = null;
    this.selectedBoma = null;
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.beneficiaries = [];
    this.selectedBeneficiaries = [];
    this.selectedBeneficiaryMap.clear();
    this.selectedGroup = null;
    this.showTable = false;
    this.totalRecords = 0;
    this.currentPage = 0;
    this.pageSize = 10;
  }

  async onAssign(): Promise<void> {
    if (!this.selectedBeneficiaries.length || !this.selectedGroup) {
      this.msg.add({
        severity: 'warn',
        summary: 'Selection Required',
        detail: 'Please select at least one beneficiary and one group before assigning.',
      });
      return;
    }

    this.isAssigning = true;
    this.cdr.detectChanges();

    try {
      const payload = this.selectedBeneficiaries.map((beneficiary) => ({
        id: this.normalizeNullableId(beneficiary.id),
        beneficiaryId: this.normalizeNumber(beneficiary.beneficiaryId),
        groupId: this.normalizeNumber(this.selectedGroup),
      }));

      const res = await this.api.POST<BeneficiaryGroupAssignResponse>(
        this.beneficiaryGroupAssignEndpoint,
        payload
      );
      const data = res?.data;

      if (!this.isApiSuccess(data)) {
        throw new Error(data?.message || 'Unable to assign beneficiary group');
      }

      this.msg.add({
        severity: 'success',
        summary: 'Assigned',
        detail: data?.message || `${payload.length} beneficiary group mapping(s) saved successfully.`,
      });

      this.selectedBeneficiaryMap.clear();
      this.selectedBeneficiaries = [];
      await this.loadBeneficiaries();
    } catch (err) {
      console.error('Failed to assign beneficiary groups', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to assign selected beneficiaries to the group.',
      });
    } finally {
      this.isAssigning = false;
      this.cdr.detectChanges();
    }
  }

  onSelectionChange(selection: BeneficiaryGroupRow[]): void {
    const currentPageKeys = new Set(this.beneficiaries.map((row) => row.rowKey));
    currentPageKeys.forEach((key) => this.selectedBeneficiaryMap.delete(key));

    selection
      .filter((row) => currentPageKeys.has(row.rowKey))
      .forEach((row) => this.selectedBeneficiaryMap.set(row.rowKey, row));

    this.selectedBeneficiaries = Array.from(this.selectedBeneficiaryMap.values());
  }

  canSearch(): boolean {
    return !!this.selectedState && !!this.selectedCounty && !!this.selectedPayam && !!this.selectedBoma;
  }

  formatGender(gender: string | null | undefined): string {
    const normalizedGender = (gender ?? '').trim().toUpperCase();

    if (normalizedGender === 'M') return 'Male';
    if (normalizedGender === 'F') return 'Female';

    return gender?.trim() || '--';
  }

  private async loadBeneficiaries(): Promise<void> {
    this.isLoadingBeneficiaries = true;
    this.isSearching = true;
    this.selectedBeneficiaries = [];
    this.cdr.detectChanges();

    try {
      const payload = this.createBeneficiarySearchPayload();
      const res = await this.api.POST<BeneficiaryGroupSearchResponse>(
        this.beneficiaryGroupSearchEndpoint,
        payload,
        'global',
        { params: { page: this.currentPage, size: this.pageSize } }
      );
      const data = res?.data;

      if (!this.isApiSuccess(data, Array.isArray(data?.beneficiaryGroupSummaryList))) {
        throw new Error(data?.message || 'Unable to load beneficiary list');
      }

      const list = Array.isArray(data?.beneficiaryGroupSummaryList)
        ? data.beneficiaryGroupSummaryList
        : [];

      this.beneficiaries = list.map((item, index) => {
        const row: BeneficiaryGroupSummary = {
          id: this.normalizeNumber(item.id),
          beneficiaryId: this.normalizeNumber(item.beneficiaryId),
          applicationId: item.applicationId ?? '',
          respondentFullName: item.respondentFullName ?? '',
          respondentAge: this.normalizeNumber(item.respondentAge),
          respondentGender: item.respondentGender ?? '',
          groupId: this.normalizeNumber(item.groupId),
          groupName: item.groupName ?? '',
          vlsaFormed: !!item.vlsaFormed,
        };

        return {
          ...row,
          rowKey: this.createBeneficiaryRowKey(row, index),
        };
      });
      this.beneficiaries.forEach((row) => {
        if (this.selectedBeneficiaryMap.has(row.rowKey)) {
          this.selectedBeneficiaryMap.set(row.rowKey, row);
        }
      });
      this.selectedBeneficiaries = Array.from(this.selectedBeneficiaryMap.values());
      this.totalRecords = this.normalizeNumber(data?.total ?? list.length);
    } catch (err) {
      console.error('Failed to load beneficiary group mapping list', err);
      this.beneficiaries = [];
      this.totalRecords = 0;
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load beneficiary list.',
      });
    } finally {
      this.isLoadingBeneficiaries = false;
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  private createBeneficiarySearchPayload(): BeneficiaryGroupSearchPayload {
    return {
      stateId: this.normalizeNumber(this.selectedState),
      countyId: this.normalizeNumber(this.selectedCounty),
      payamId: this.normalizeNumber(this.selectedPayam),
      bomaId: this.normalizeNumber(this.selectedBoma),
      groupId: 0,
    };
  }

  private createBeneficiaryRowKey(row: BeneficiaryGroupSummary, index: number): string {
    if (row.id > 0) return `id:${row.id}`;
    if (row.beneficiaryId > 0) return `beneficiary:${row.beneficiaryId}`;
    if (row.applicationId) return `application:${row.applicationId}`;

    return `page:${this.currentPage}:index:${index}`;
  }

  private normalizeNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private normalizeNullableId(value: unknown): number | null {
    const numericValue = this.normalizeNumber(value);
    return numericValue > 0 ? numericValue : null;
  }

  private isApiSuccess(data: { code?: number | string | null } | null | undefined, fallback = false): boolean {
    if (!data) return fallback;
    if (data.code === undefined || data.code === null || data.code === '') return fallback;
    const code = Number(data.code);
    return code === 0 || code === 200;
  }
}
