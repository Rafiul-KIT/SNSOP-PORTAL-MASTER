import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../../services/api.service';
import { IdName, LookupService } from '../../../../services/lookup.service';

interface BusinessPlanFilters {
  stateId: string | number | null;
  countyId: string | number | null;
  payamId: string | number | null;
  bomaId: string | number | null;
}

interface BusinessPlanSearchPayload {
  stateId: number | null;
  countyId: number | null;
  payamId: number | null;
  bomaId: number | null;
  groupId: number | null;
}

interface BusinessPlanResponse {
  code?: number | string | null;
  message?: string | null;
  content?: BusinessPlanRecord[] | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  totalElements?: number | null;
}

interface BusinessPlanRecord {
  id: number;
  beneficiaryId: number;
  householdNumber: string;
  respondentFullName: string;
  respondentAge: number;
  businessType: number | null;
  businessDescription: string;
  howSpent: string;
  inPersonPercentage: number | null;
  groupPercentage: number | null;
  planStatus: boolean | null;
  planSubmitted: boolean | null;
  planScreened: boolean | null;
  planApproved: boolean | null;
  planRejectionReason: string;
}

interface BusinessPlanRow extends BusinessPlanRecord {
  isDirty: boolean;
  isSaving: boolean;
}

type EditableBusinessPlanSnapshot = Pick<
  BusinessPlanRecord,
  | 'id'
  | 'beneficiaryId'
  | 'householdNumber'
  | 'respondentFullName'
  | 'respondentAge'
  | 'businessType'
  | 'businessDescription'
  | 'howSpent'
  | 'inPersonPercentage'
  | 'groupPercentage'
  | 'planStatus'
  | 'planSubmitted'
  | 'planScreened'
  | 'planApproved'
  | 'planRejectionReason'
>;

@Component({
  selector: 'app-economic-opportunities-business-plan-development',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbModule,
    ButtonModule,
    FloatLabel,
    InputText,
    Loader,
    Paginator,
    Select,
    TableModule,
    TextareaModule,
    Toast,
  ],
  providers: [MessageService],
  templateUrl: './economic-opportunities-business-plan-development.html',
  styleUrl: './economic-opportunities-business-plan-development.scss',
})
export class EconomicOpportunitiesBusinessPlanDevelopment implements OnInit {
  private readonly getByGeoEndpoint = '/api/econ-op/business-plan-development/get-by-geo';
  private readonly saveBulkEndpoint = '/api/econ-op/business-plan-development/save-bulk';
  private readonly originalRows = new Map<number, EditableBusinessPlanSnapshot>();

  isLoading = false;
  isSearching = false;
  isBulkSaving = false;
  rows: BusinessPlanRow[] = [];
  selectedRows: BusinessPlanRow[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];

  filters: BusinessPlanFilters = this.createDefaultFilters();

  readonly booleanOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ];

  readonly businessTypeOptions = [
    { label: 'Farm', value: 1 },
    { label: 'Non-Farm', value: 2 },
  ];

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Business Plan Development', icon: 'fas fa-file-invoice-dollar' },
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
      this.showError('Unable to load states.');
    }
  }

  async onStateChange(): Promise<void> {
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.filters.countyId = null;
    this.filters.payamId = null;
    this.filters.bomaId = null;

    if (!this.filters.stateId) return;

    try {
      this.counties = await this.lookupService.getCountyListByStateId(this.filters.stateId);
    } catch (err) {
      console.error('Failed to load counties', err);
      this.showError('Unable to load counties.');
    }
  }

  async onCountyChange(): Promise<void> {
    this.payams = [];
    this.bomas = [];
    this.filters.payamId = null;
    this.filters.bomaId = null;

    if (!this.filters.countyId) return;

    try {
      this.payams = await this.lookupService.getPayamListByCountyId(this.filters.countyId);
    } catch (err) {
      console.error('Failed to load payams', err);
      this.showError('Unable to load payams.');
    }
  }

  async onPayamChange(): Promise<void> {
    this.bomas = [];
    this.filters.bomaId = null;

    if (!this.filters.payamId) return;

    try {
      this.bomas = await this.lookupService.getBomaListByPayamId(this.filters.payamId);
    } catch (err) {
      console.error('Failed to load bomas', err);
      this.showError('Unable to load bomas.');
    }
  }

  async search(): Promise<void> {
    this.currentPage = 0;
    this.pageSize = this.pageSize || 10;
    await this.loadRows();
  }

  async onPageChange(event: PaginatorState): Promise<void> {
    this.currentPage = event.page ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    await this.loadRows();
  }

  resetFilters(): void {
    this.filters = this.createDefaultFilters();
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.rows = [];
    this.selectedRows = [];
    this.totalRecords = 0;
    this.currentPage = 0;
    this.pageSize = 10;
    this.originalRows.clear();
  }

  async saveRow(row: BusinessPlanRow): Promise<void> {
    if (!row.isDirty || row.isSaving) return;

    const validation = this.isValidData(row, this.validHouseholdNumbers);
    if (!validation.isValid) {
      this.msg.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: validation.errorMessage,
      });
      return;
    }

    const payload = this.toEditableSnapshot(row);
    row.isSaving = true;
    this.cdr.detectChanges();

    try {
      const res = await this.api.POST(this.saveBulkEndpoint, [payload]);
      const data = res?.data;

      if (!this.isApiSuccess(data)) {
        throw new Error(data?.message || 'Unable to update business plan');
      }

      Object.assign(row, payload);
      this.originalRows.set(row.id, { ...payload });
      row.isDirty = false;

      this.msg.add({
        severity: 'success',
        summary: 'Updated',
        detail: `Business plan row for ${row.respondentFullName || row.householdNumber || row.id} updated successfully.`,
      });
    } catch (err) {
      console.error('Failed to update business plan row', err);
      this.showError('Unable to update the selected business plan row.');
      this.refreshDirtyState(row);
    } finally {
      row.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async saveSelectedRows(): Promise<void> {
    const dirtyRows = this.selectedRows.filter((row) => row.isDirty && !row.isSaving);

    if (!dirtyRows.length) {
      this.msg.add({
        severity: 'warn',
        summary: 'No Changes Selected',
        detail: 'Please select at least one edited row before bulk updating.',
      });
      return;
    }

    for (const row of dirtyRows) {
      const validation = this.isValidData(row, this.validHouseholdNumbers);
      if (!validation.isValid) {
        this.msg.add({
          severity: 'warn',
          summary: 'Validation Error',
          detail: `Row for ${row.respondentFullName || row.householdNumber || row.id}: ${validation.errorMessage}`,
        });
        return;
      }
    }

    const payload = dirtyRows.map((row) => this.toEditableSnapshot(row));
    this.isBulkSaving = true;
    dirtyRows.forEach((row) => (row.isSaving = true));
    this.cdr.detectChanges();

    try {
      const res = await this.api.POST(this.saveBulkEndpoint, payload);
      const data = res?.data;

      if (!this.isApiSuccess(data)) {
        throw new Error(data?.message || 'Unable to update selected business plans');
      }

      dirtyRows.forEach((row) => {
        const saved = this.toEditableSnapshot(row);
        Object.assign(row, saved);
        this.originalRows.set(row.id, { ...saved });
        row.isDirty = false;
      });

      this.msg.add({
        severity: 'success',
        summary: 'Updated',
        detail: `${dirtyRows.length} selected business plan row(s) updated successfully.`,
      });
    } catch (err) {
      console.error('Failed to bulk update business plan rows', err);
      this.showError('Unable to update the selected business plan rows.');
      dirtyRows.forEach((row) => this.refreshDirtyState(row));
    } finally {
      dirtyRows.forEach((row) => (row.isSaving = false));
      this.isBulkSaving = false;
      this.cdr.detectChanges();
    }
  }

  isValidData(row: BusinessPlanRow, validHouseholdNumbers: Set<string>): { isValid: boolean; errorMessage: string } {
    const householdNumber = row.householdNumber.trim();

    if (!householdNumber) {
      return { isValid: false, errorMessage: 'Household Number is required.' };
    }

    if (!validHouseholdNumbers.has(householdNumber)) {
      return { isValid: false, errorMessage: 'Household Number must be in the valid household list.' };
    }

    if (row.planStatus === null || row.planStatus === undefined) {
      return { isValid: false, errorMessage: 'Business Plan Status is required.' };
    }

    if (!row.businessType || (row.businessType !== 1 && row.businessType !== 2)) {
      return { isValid: false, errorMessage: 'Business Type is required (Farm or Non-Farm).' };
    }

    if (row.planApproved === null || row.planApproved === undefined) {
      return { isValid: false, errorMessage: 'Plan Approved status is required.' };
    }

    if (row.planApproved === false) {
      if (!row.planRejectionReason || row.planRejectionReason.trim() === '') {
        return { isValid: false, errorMessage: 'Rejection Reason is required when Plan Approved is No.' };
      }
    } else {
      if (row.planRejectionReason && row.planRejectionReason.trim() !== '') {
        return { isValid: false, errorMessage: 'Rejection Reason must be blank when Plan Approved is Yes.' };
      }
    }

    const inPerson = row.inPersonPercentage;
    const group = row.groupPercentage;

    if (inPerson !== null || group !== null) {
      if (inPerson === null || group === null) {
        return { isValid: false, errorMessage: 'Both In-Person and Group percentages must be provided if either is provided.' };
      }

      if (inPerson < 0 || inPerson > 100) {
        return { isValid: false, errorMessage: 'In-Person percentage must be between 0 and 100.' };
      }

      if (group < 0 || group > 100) {
        return { isValid: false, errorMessage: 'Group percentage must be between 0 and 100.' };
      }

      const sum = Number(inPerson) + Number(group);
      if (Math.abs(sum - 100) > 0.01) {
        return { isValid: false, errorMessage: 'Sum of In-Person and Group percentages must equal 100.' };
      }
    }

    return { isValid: true, errorMessage: '' };
  }

  private get validHouseholdNumbers(): Set<string> {
    return new Set(
      this.rows
        .map((row) => row.householdNumber.trim())
        .filter((householdNumber) => householdNumber.length > 0)
    );
  }

  onRowValueChange(row: BusinessPlanRow): void {
    if (row.planApproved === true) {
      row.planRejectionReason = '';
    }

    row.businessType = this.normalizeNumberNullable(row.businessType);
    row.respondentAge = this.normalizeNumber(row.respondentAge);
    row.inPersonPercentage = this.normalizeNumberNullable(row.inPersonPercentage);
    row.groupPercentage = this.normalizeNumberNullable(row.groupPercentage);
    row.businessDescription = row.businessDescription ?? '';
    row.howSpent = row.howSpent ?? '';
    row.planRejectionReason = row.planRejectionReason ?? '';
    this.refreshDirtyState(row);
  }

  private async loadRows(): Promise<void> {
    try {
      this.isLoading = true;
      this.isSearching = true;
      this.cdr.detectChanges();

      const payload = this.createSearchPayload();
      const res = await this.api.POST<BusinessPlanResponse>(
        this.getByGeoEndpoint,
        payload,
        'global',
        { params: { page: this.currentPage, size: this.pageSize } }
      );
      const data = res?.data;

      const hasEmptySearchPayload =
        data?.code == null &&
        data?.message == null &&
        data?.content == null;

      if (!this.isApiSuccess(data, Array.isArray(data?.content) || hasEmptySearchPayload)) {
        throw new Error(data?.message || 'Unable to load business plan list');
      }

      const content = Array.isArray(data?.content) ? data.content : [];
      this.rows = content.map((item) => this.toRow(item));
      this.selectedRows = [];
      this.totalRecords = Number(data?.totalElements ?? content.length ?? 0);
      this.currentPage = Number(data?.pageNumber ?? this.currentPage ?? 0);
      this.pageSize = Number(data?.pageSize ?? this.pageSize ?? 10) || 10;
      this.snapshotRows(this.rows);
    } catch (err) {
      console.error('Failed to load business plan list', err);
      this.rows = [];
      this.totalRecords = 0;
      this.showError('Unable to load business plan data.');
    } finally {
      this.isLoading = false;
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  private createDefaultFilters(): BusinessPlanFilters {
    return {
      stateId: null,
      countyId: null,
      payamId: null,
      bomaId: null,
    };
  }

  private createSearchPayload(): BusinessPlanSearchPayload {
    return {
      stateId: this.normalizeSelectedId(this.filters.stateId),
      countyId: this.normalizeSelectedId(this.filters.countyId),
      payamId: this.normalizeSelectedId(this.filters.payamId),
      bomaId: this.normalizeSelectedId(this.filters.bomaId),
      groupId: null,
    };
  }

  private toRow(item: BusinessPlanRecord): BusinessPlanRow {
    return {
      id: this.normalizeNumber(item.id),
      beneficiaryId: this.normalizeNumber(item.beneficiaryId),
      householdNumber: item.householdNumber ?? '',
      respondentFullName: item.respondentFullName ?? '',
      respondentAge: this.normalizeNumber(item.respondentAge),
      businessType: this.normalizeNumberNullable(item.businessType),
      businessDescription: item.businessDescription ?? '',
      howSpent: item.howSpent ?? '',
      inPersonPercentage: this.normalizeNumberNullable(item.inPersonPercentage),
      groupPercentage: this.normalizeNumberNullable(item.groupPercentage),
      planStatus: this.normalizeBooleanNullable(item.planStatus),
      planSubmitted: this.normalizeBooleanNullable(item.planSubmitted),
      planScreened: this.normalizeBooleanNullable(item.planScreened),
      planApproved: this.normalizeBooleanNullable(item.planApproved),
      planRejectionReason: item.planRejectionReason ?? '',
      isDirty: false,
      isSaving: false,
    };
  }

  private snapshotRows(rows: BusinessPlanRow[]): void {
    this.originalRows.clear();
    rows.forEach((row) => {
      this.originalRows.set(row.id, this.toEditableSnapshot(row));
    });
  }

  private refreshDirtyState(row: BusinessPlanRow): void {
    const original = this.originalRows.get(row.id);
    if (!original) {
      row.isDirty = false;
      return;
    }

    const current = this.toEditableSnapshot(row);
    row.isDirty = Object.keys(current).some((key) => {
      const typedKey = key as keyof EditableBusinessPlanSnapshot;
      return original[typedKey] !== current[typedKey];
    });
  }

  private toEditableSnapshot(row: BusinessPlanRecord): EditableBusinessPlanSnapshot {
    return {
      id: this.normalizeNumber(row.id),
      beneficiaryId: this.normalizeNumber(row.beneficiaryId),
      householdNumber: (row.householdNumber ?? '').trim(),
      respondentFullName: (row.respondentFullName ?? '').trim(),
      respondentAge: this.normalizeNumber(row.respondentAge),
      businessType: this.normalizeNumberNullable(row.businessType),
      businessDescription: (row.businessDescription ?? '').trim(),
      howSpent: (row.howSpent ?? '').trim(),
      inPersonPercentage: this.normalizeNumberNullable(row.inPersonPercentage),
      groupPercentage: this.normalizeNumberNullable(row.groupPercentage),
      planStatus: this.normalizeBooleanNullable(row.planStatus),
      planSubmitted: this.normalizeBooleanNullable(row.planSubmitted),
      planScreened: this.normalizeBooleanNullable(row.planScreened),
      planApproved: this.normalizeBooleanNullable(row.planApproved),
      planRejectionReason: (row.planRejectionReason ?? '').trim(),
    };
  }

  private normalizeNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private normalizeSelectedId(value: unknown): number | null {
    const numericValue = this.normalizeNumber(value);
    return numericValue > 0 ? numericValue : null;
  }

  private normalizeNumberNullable(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private normalizeBooleanNullable(value: unknown): boolean | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    return null;
  }

  private isApiSuccess(data: { code?: number | string | null } | null | undefined, fallback = false): boolean {
    if (!data) return fallback;
    if (data.code === undefined || data.code === null || data.code === '') return fallback;
    const code = Number(data.code);
    return code === 0 || code === 200;
  }

  private showError(detail: string): void {
    this.msg.add({
      severity: 'error',
      summary: 'Error',
      detail,
    });
  }
}
