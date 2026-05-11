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

interface LivelihoodGrantFilters {
  stateId: string | number | null;
  countyId: string | number | null;
  payamId: string | number | null;
  bomaId: string | number | null;
}

interface LivelihoodGrantSearchPayload {
  stateId: number;
  countyId: number;
  payamId: number;
  bomaId: number;
  groupId: number;
}

interface LivelihoodGrantResponse {
  code?: number | string | null;
  message?: string | null;
  content?: LivelihoodGrantRecord[] | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  totalElements?: number | null;
}

interface LivelihoodGrantRecord {
  id: number;
  beneficiaryId: number;
  householdNumber: string;
  respondentFullName: string;
  respondentAge: number;
  paymentCycle: number;
  paymentAmount: number;
  paymentDate: string;
  actualPaymentDate: string;
}

interface LivelihoodGrantRow extends LivelihoodGrantRecord {
  isDirty: boolean;
  isSaving: boolean;
}

type EditableLivelihoodGrantSnapshot = Pick<
  LivelihoodGrantRecord,
  | 'id'
  | 'beneficiaryId'
  | 'householdNumber'
  | 'respondentFullName'
  | 'respondentAge'
  | 'paymentCycle'
  | 'paymentAmount'
  | 'paymentDate'
  | 'actualPaymentDate'
>;

@Component({
  selector: 'app-economic-opportunities-livelihood-grant-disbursement',
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
  templateUrl: './economic-opportunities-livelihood-grant-disbursement.html',
  styleUrl: './economic-opportunities-livelihood-grant-disbursement.scss',
})
export class EconomicOpportunitiesLivelihoodGrantDisbursement implements OnInit {
  private readonly getByGeoEndpoint = '/api/econ-op/livelihood-grant-disbursement/get-by-geo';
  private readonly saveBulkEndpoint = '/api/econ-op/livelihood-grant-disbursement/save-bulk';
  private readonly originalRows = new Map<number, EditableLivelihoodGrantSnapshot>();

  isLoading = false;
  isSearching = false;
  isBulkSaving = false;
  rows: LivelihoodGrantRow[] = [];
  selectedRows: LivelihoodGrantRow[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];

  filters: LivelihoodGrantFilters = this.createDefaultFilters();

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Livelihood Grant Disbursement', icon: 'fas fa-hand-holding-usd' },
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

  async saveRow(row: LivelihoodGrantRow): Promise<void> {
    if (!row.isDirty || row.isSaving) return;

    const payload = this.toEditableSnapshot(row);
    row.isSaving = true;
    this.cdr.detectChanges();

    try {
      const res = await this.api.POST(this.saveBulkEndpoint, [payload]);
      const data = res?.data;

      if (!this.isApiSuccess(data)) {
        throw new Error(data?.message || 'Unable to update livelihood grant disbursement');
      }

      Object.assign(row, payload);
      this.originalRows.set(row.id, { ...payload });
      row.isDirty = false;

      this.msg.add({
        severity: 'success',
        summary: 'Updated',
        detail: `Livelihood grant row for ${row.respondentFullName || row.householdNumber || row.id} updated successfully.`,
      });
    } catch (err) {
      console.error('Failed to update livelihood grant row', err);
      this.showError('Unable to update the selected livelihood grant row.');
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

    const payload = dirtyRows.map((row) => this.toEditableSnapshot(row));
    this.isBulkSaving = true;
    dirtyRows.forEach((row) => (row.isSaving = true));
    this.cdr.detectChanges();

    try {
      const res = await this.api.POST(this.saveBulkEndpoint, payload);
      const data = res?.data;

      if (!this.isApiSuccess(data)) {
        throw new Error(data?.message || 'Unable to update selected livelihood grant rows');
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
        detail: `${dirtyRows.length} selected livelihood grant row(s) updated successfully.`,
      });
    } catch (err) {
      console.error('Failed to bulk update livelihood grant rows', err);
      this.showError('Unable to update the selected livelihood grant rows.');
      dirtyRows.forEach((row) => this.refreshDirtyState(row));
    } finally {
      dirtyRows.forEach((row) => (row.isSaving = false));
      this.isBulkSaving = false;
      this.cdr.detectChanges();
    }
  }

  onRowValueChange(row: LivelihoodGrantRow): void {
    row.respondentAge = this.normalizeNumber(row.respondentAge);
    row.paymentCycle = this.normalizeNumber(row.paymentCycle);
    row.paymentAmount = this.normalizeNumber(row.paymentAmount);
    row.paymentDate = row.paymentDate ?? '';
    row.actualPaymentDate = row.actualPaymentDate ?? '';
    this.refreshDirtyState(row);
  }

  private async loadRows(): Promise<void> {
    try {
      this.isLoading = true;
      this.isSearching = true;
      this.cdr.detectChanges();

      const res = await this.api.POST<LivelihoodGrantResponse>(
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
        throw new Error(data?.message || 'Unable to load livelihood grant list');
      }

      const content = Array.isArray(data?.content) ? data.content : [];
      this.rows = content.map((item) => this.toRow(item));
      this.selectedRows = [];
      this.totalRecords = Number(data?.totalElements ?? content.length ?? 0);
      this.currentPage = Number(data?.pageNumber ?? this.currentPage ?? 0);
      this.pageSize = Number(data?.pageSize ?? this.pageSize ?? 10) || 10;
      this.snapshotRows(this.rows);
    } catch (err) {
      console.error('Failed to load livelihood grant list', err);
      this.rows = [];
      this.totalRecords = 0;
      this.showError('Unable to load livelihood grant data.');
    } finally {
      this.isLoading = false;
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  private createDefaultFilters(): LivelihoodGrantFilters {
    return {
      stateId: null,
      countyId: null,
      payamId: null,
      bomaId: null,
    };
  }

  private createSearchPayload(): LivelihoodGrantSearchPayload {
    return {
      stateId: this.normalizeNumber(this.filters.stateId),
      countyId: this.normalizeNumber(this.filters.countyId),
      payamId: this.normalizeNumber(this.filters.payamId),
      bomaId: this.normalizeNumber(this.filters.bomaId),
      groupId: 0,
    };
  }

  private toRow(item: LivelihoodGrantRecord): LivelihoodGrantRow {
    return {
      id: this.normalizeNumber(item.id),
      beneficiaryId: this.normalizeNumber(item.beneficiaryId),
      householdNumber: item.householdNumber ?? '',
      respondentFullName: item.respondentFullName ?? '',
      respondentAge: this.normalizeNumber(item.respondentAge),
      paymentCycle: this.normalizeNumber(item.paymentCycle),
      paymentAmount: this.normalizeNumber(item.paymentAmount),
      paymentDate: this.normalizeDate(item.paymentDate),
      actualPaymentDate: this.normalizeDate(item.actualPaymentDate),
      isDirty: false,
      isSaving: false,
    };
  }

  private snapshotRows(rows: LivelihoodGrantRow[]): void {
    this.originalRows.clear();
    rows.forEach((row) => {
      this.originalRows.set(row.id, this.toEditableSnapshot(row));
    });
  }

  private refreshDirtyState(row: LivelihoodGrantRow): void {
    const original = this.originalRows.get(row.id);
    if (!original) {
      row.isDirty = false;
      return;
    }

    const current = this.toEditableSnapshot(row);
    row.isDirty = Object.keys(current).some((key) => {
      const typedKey = key as keyof EditableLivelihoodGrantSnapshot;
      return original[typedKey] !== current[typedKey];
    });
  }

  private toEditableSnapshot(row: LivelihoodGrantRecord): EditableLivelihoodGrantSnapshot {
    return {
      id: this.normalizeNumber(row.id),
      beneficiaryId: this.normalizeNumber(row.beneficiaryId),
      householdNumber: (row.householdNumber ?? '').trim(),
      respondentFullName: (row.respondentFullName ?? '').trim(),
      respondentAge: this.normalizeNumber(row.respondentAge),
      paymentCycle: this.normalizeNumber(row.paymentCycle),
      paymentAmount: this.normalizeNumber(row.paymentAmount),
      paymentDate: this.normalizeDate(row.paymentDate),
      actualPaymentDate: this.normalizeDate(row.actualPaymentDate),
    };
  }

  private normalizeDate(value: unknown): string {
    if (!value) return '';
    return String(value).slice(0, 10);
  }

  private normalizeNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
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
