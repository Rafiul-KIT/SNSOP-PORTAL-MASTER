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
import { Toast } from 'primeng/toast';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../../services/api.service';
import { IdName, LookupService } from '../../../../services/lookup.service';

interface FinancialServiceFilters {
  stateId: string | number | null;
  countyId: string | number | null;
  payamId: string | number | null;
  bomaId: string | number | null;
}

interface FinancialServiceSearchPayload {
  stateId: number | null;
  countyId: number | null;
  payamId: number | null;
  bomaId: number | null;
  groupId: number | null;
}

interface FinancialServiceResponse {
  code?: number | string | null;
  message?: string | null;
  content?: FinancialServiceRecord[] | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  totalElements?: number | null;
}

interface FinancialServiceRecord {
  id: number;
  beneficiaryId: number;
  householdNumber: string;
  respondentFullName: string;
  respondentAge: number;
  connectedToFinancialService: boolean | null;
  financialServiceName: string;
  financialServiceConnectedAt: string;
  depositAccountOpened: boolean | null;
  depositAccountOpenedAt: string;
  accountLastActivityDate: string;
}

interface FinancialServiceRow extends FinancialServiceRecord {
  isDirty: boolean;
  isSaving: boolean;
}

type EditableFinancialServiceSnapshot = Pick<
  FinancialServiceRecord,
  | 'id'
  | 'beneficiaryId'
  | 'householdNumber'
  | 'respondentFullName'
  | 'respondentAge'
  | 'connectedToFinancialService'
  | 'financialServiceName'
  | 'financialServiceConnectedAt'
  | 'depositAccountOpened'
  | 'depositAccountOpenedAt'
  | 'accountLastActivityDate'
>;

@Component({
  selector: 'app-economic-opportunities-financial-service-linkage-tracking',
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
    Toast,
  ],
  providers: [MessageService],
  templateUrl: './economic-opportunities-financial-service-linkage-tracking.html',
  styleUrl: './economic-opportunities-financial-service-linkage-tracking.scss',
})
export class EconomicOpportunitiesFinancialServiceLinkageTracking implements OnInit {
  private readonly getByGeoEndpoint = '/api/econ-op/finance-service-linkage/get-by-geo';
  private readonly saveBulkEndpoint = '/api/econ-op/finance-service-linkage/save-bulk';
  private readonly originalRows = new Map<number, EditableFinancialServiceSnapshot>();

  isLoading = false;
  isSearching = false;
  isBulkSaving = false;
  rows: FinancialServiceRow[] = [];
  selectedRows: FinancialServiceRow[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];

  filters: FinancialServiceFilters = this.createDefaultFilters();

  readonly booleanOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ];

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Financial Service Linkage Tracking', icon: 'fas fa-link' },
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

  async saveRow(row: FinancialServiceRow): Promise<void> {
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
        throw new Error(data?.message || 'Unable to update financial service linkage');
      }

      Object.assign(row, payload);
      this.originalRows.set(row.id, { ...payload });
      row.isDirty = false;

      this.msg.add({
        severity: 'success',
        summary: 'Updated',
        detail: `Financial service row for ${row.respondentFullName || row.householdNumber || row.id} updated successfully.`,
      });
    } catch (err) {
      console.error('Failed to update financial service row', err);
      this.showError('Unable to update the selected financial service row.');
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
        throw new Error(data?.message || 'Unable to update selected financial service rows');
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
        detail: `${dirtyRows.length} selected financial service row(s) updated successfully.`,
      });
    } catch (err) {
      console.error('Failed to bulk update financial service rows', err);
      this.showError('Unable to update the selected financial service rows.');
      dirtyRows.forEach((row) => this.refreshDirtyState(row));
    } finally {
      dirtyRows.forEach((row) => (row.isSaving = false));
      this.isBulkSaving = false;
      this.cdr.detectChanges();
    }
  }

  isValidData(row: FinancialServiceRow, validList: Set<string>): { isValid: boolean; errorMessage: string } {
    const householdNumber = row.householdNumber.trim();

    if (!householdNumber) {
      return { isValid: false, errorMessage: 'Household Number is required.' };
    }

    if (!validList.has(householdNumber)) {
      return { isValid: false, errorMessage: 'Household Number must be in the valid household list.' };
    }

    if (row.connectedToFinancialService === null || row.connectedToFinancialService === undefined) {
      return { isValid: false, errorMessage: 'Connected Financial Services is required.' };
    }

    if (!row.financialServiceConnectedAt) {
      return { isValid: false, errorMessage: 'Financial Service Connection Date is required.' };
    }

    if (row.depositAccountOpened === null || row.depositAccountOpened === undefined) {
      return { isValid: false, errorMessage: 'Deposit Account Opened is required.' };
    }

    if (row.depositAccountOpened === true && !row.depositAccountOpenedAt) {
      return { isValid: false, errorMessage: 'Deposit Account Opening Date is required when Deposit Account Opened is Yes.' };
    }

    if (row.accountLastActivityDate) {
      const today = this.toLocalDateOnly(new Date());
      const activityDate = this.toLocalDateOnly(row.accountLastActivityDate);
      if (activityDate > today) {
        return { isValid: false, errorMessage: 'Account Last Activity Date cannot be in the future.' };
      }
    }

    return { isValid: true, errorMessage: '' };
  }

  onRowValueChange(row: FinancialServiceRow): void {
    row.respondentAge = this.normalizeNumber(row.respondentAge);
    row.financialServiceName = row.financialServiceName ?? '';
    row.financialServiceConnectedAt = row.financialServiceConnectedAt ?? '';
    row.depositAccountOpenedAt = row.depositAccountOpenedAt ?? '';
    row.accountLastActivityDate = row.accountLastActivityDate ?? '';
    this.refreshDirtyState(row);
  }

  private get validHouseholdNumbers(): Set<string> {
    return new Set(
      this.rows
        .map((row) => row.householdNumber.trim())
        .filter((householdNumber) => householdNumber.length > 0)
    );
  }

  private async loadRows(): Promise<void> {
    try {
      this.isLoading = true;
      this.isSearching = true;
      this.cdr.detectChanges();

      const res = await this.api.POST<FinancialServiceResponse>(
        this.getByGeoEndpoint,
        this.createSearchPayload(),
        'global',
        { params: { page: this.currentPage, size: this.pageSize } }
      );
      const data = res?.data;

      const hasEmptySearchPayload =
        data?.code == null &&
        data?.message == null &&
        data?.content == null;

      if (!this.isApiSuccess(data, Array.isArray(data?.content) || hasEmptySearchPayload)) {
        throw new Error(data?.message || 'Unable to load financial service list');
      }

      const content = Array.isArray(data?.content) ? data.content : [];
      this.rows = content.map((item) => this.toRow(item));
      this.selectedRows = [];
      this.totalRecords = Number(data?.totalElements ?? content.length ?? 0);
      this.currentPage = Number(data?.pageNumber ?? this.currentPage ?? 0);
      this.pageSize = Number(data?.pageSize ?? this.pageSize ?? 10) || 10;
      this.snapshotRows(this.rows);
    } catch (err) {
      console.error('Failed to load financial service list', err);
      this.rows = [];
      this.totalRecords = 0;
      this.showError('Unable to load financial service data.');
    } finally {
      this.isLoading = false;
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  private createDefaultFilters(): FinancialServiceFilters {
    return {
      stateId: null,
      countyId: null,
      payamId: null,
      bomaId: null,
    };
  }

  private createSearchPayload(): FinancialServiceSearchPayload {
    return {
      stateId: this.normalizeSelectedId(this.filters.stateId),
      countyId: this.normalizeSelectedId(this.filters.countyId),
      payamId: this.normalizeSelectedId(this.filters.payamId),
      bomaId: this.normalizeSelectedId(this.filters.bomaId),
      groupId: null,
    };
  }

  private toRow(item: FinancialServiceRecord): FinancialServiceRow {
    return {
      id: this.normalizeNumber(item.id),
      beneficiaryId: this.normalizeNumber(item.beneficiaryId),
      householdNumber: item.householdNumber ?? '',
      respondentFullName: item.respondentFullName ?? '',
      respondentAge: this.normalizeNumber(item.respondentAge),
      connectedToFinancialService: this.normalizeBooleanNullable(item.connectedToFinancialService),
      financialServiceName: item.financialServiceName ?? '',
      financialServiceConnectedAt: this.normalizeDate(item.financialServiceConnectedAt),
      depositAccountOpened: this.normalizeBooleanNullable(item.depositAccountOpened),
      depositAccountOpenedAt: this.normalizeDate(item.depositAccountOpenedAt),
      accountLastActivityDate: this.normalizeDate(item.accountLastActivityDate),
      isDirty: false,
      isSaving: false,
    };
  }

  private snapshotRows(rows: FinancialServiceRow[]): void {
    this.originalRows.clear();
    rows.forEach((row) => {
      this.originalRows.set(row.id, this.toEditableSnapshot(row));
    });
  }

  private refreshDirtyState(row: FinancialServiceRow): void {
    const original = this.originalRows.get(row.id);
    if (!original) {
      row.isDirty = false;
      return;
    }

    const current = this.toEditableSnapshot(row);
    row.isDirty = Object.keys(current).some((key) => {
      const typedKey = key as keyof EditableFinancialServiceSnapshot;
      return original[typedKey] !== current[typedKey];
    });
  }

  private toEditableSnapshot(row: FinancialServiceRecord): EditableFinancialServiceSnapshot {
    return {
      id: this.normalizeNumber(row.id),
      beneficiaryId: this.normalizeNumber(row.beneficiaryId),
      householdNumber: (row.householdNumber ?? '').trim(),
      respondentFullName: (row.respondentFullName ?? '').trim(),
      respondentAge: this.normalizeNumber(row.respondentAge),
      connectedToFinancialService: this.normalizeBooleanNullable(row.connectedToFinancialService),
      financialServiceName: (row.financialServiceName ?? '').trim(),
      financialServiceConnectedAt: this.normalizeDate(row.financialServiceConnectedAt),
      depositAccountOpened: this.normalizeBooleanNullable(row.depositAccountOpened),
      depositAccountOpenedAt: this.normalizeDate(row.depositAccountOpenedAt),
      accountLastActivityDate: this.normalizeDate(row.accountLastActivityDate),
    };
  }

  private normalizeDate(value: unknown): string {
    if (!value) return '';
    return String(value).slice(0, 10);
  }

  private toLocalDateOnly(value: Date | string): Date {
    const date = value instanceof Date ? value : new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private normalizeNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private normalizeSelectedId(value: unknown): number | null {
    const numericValue = this.normalizeNumber(value);
    return numericValue > 0 ? numericValue : null;
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
