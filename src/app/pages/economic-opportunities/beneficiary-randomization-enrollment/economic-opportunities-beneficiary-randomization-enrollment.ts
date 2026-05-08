import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
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

interface EnrollmentFilters {
  groupId: number | null;
  stateId: string | number | null;
  countyId: string | number | null;
  payamId: string | number | null;
  bomaId: string | number | null;
}

interface EnrollmentSearchPayload {
  stateId?: number;
  countyId?: number;
  payamId?: number;
  bomaId?: number;
  groupId: number;
}

interface EnrollmentApiResponse {
  code?: number | string | null;
  message?: string | null;
  content?: EnrollmentRecord[] | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  totalElements?: number | null;
}

interface GroupApiResponse {
  code?: number | string;
  message?: string | null;
  content?: GroupRecord[];
}

interface GroupRecord {
  id: number | string;
  groupName?: string | null;
  name?: string | null;
}

interface EnrollmentRecord {
  id: number;
  beneficiaryId: number;
  applicationId: string;
  respondentFullName: string;
  respondentAge: number;
  interestedInParticipating: boolean;
  survivesTargeting: boolean;
  treatmentArm: boolean;
  householdEnrollmentStatus: boolean;
  reasonForWhyNotEnrolled: string;
  groupId: number;
  groupName: string;
  nomineeIndex: number;
}

interface EnrollmentRow extends EnrollmentRecord {
  isDirty: boolean;
  isSaving: boolean;
}

type EditableEnrollmentSnapshot = Pick<
  EnrollmentRecord,
  | 'id'
  | 'beneficiaryId'
  | 'interestedInParticipating'
  | 'survivesTargeting'
  | 'treatmentArm'
  | 'householdEnrollmentStatus'
  | 'reasonForWhyNotEnrolled'
  | 'groupId'
  | 'nomineeIndex'
>;

@Component({
  selector: 'app-economic-opportunities-beneficiary-randomization-enrollment',
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
  templateUrl: './economic-opportunities-beneficiary-randomization-enrollment.html',
  styleUrl: './economic-opportunities-beneficiary-randomization-enrollment.scss',
})
export class EconomicOpportunitiesBeneficiaryRandomizationEnrollment implements OnInit {
  private readonly getEndpoint = '/api/econ-op/beneficiary-enrollment/get';
  private readonly saveEndpoint = '/api/econ-op/beneficiary-enrollment/save';
  private readonly groupEndpoint = '/api/econ-op/group/get';
  private readonly originalRows = new Map<number, EditableEnrollmentSnapshot>();
  private hasExternalData = false;

  @Input() set data(value: EnrollmentRecord[] | null | undefined) {
    this.hasExternalData = true;
    const rows = Array.isArray(value) ? value : [];
    this.rows = rows.map((item) => this.toRow(item));
    this.totalRecords = this.rows.length;
    this.snapshotRows(this.rows);
  }

  isLoading = false;
  isSearching = false;
  isLoadingGroups = false;
  rows: EnrollmentRow[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  groups: IdName[] = [];
  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];

  filters: EnrollmentFilters = this.createDefaultFilters();

  readonly booleanOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ];

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Beneficiary Randomization Enrollment', icon: 'fas fa-random' },
  ];

  constructor(
    private api: ApiService,
    private lookupService: LookupService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    if (!this.isEmbeddedMode) {
      this.loadGroups();
      this.loadStates();
    }
  }

  get isEmbeddedMode(): boolean {
    return this.hasExternalData;
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
    if (this.isEmbeddedMode) return;

    if (this.filters.groupId == null || this.filters.groupId === 0) {
      this.msg.add({
        severity: 'warn',
        summary: 'Group ID Required',
        detail: 'Please provide a Group ID before searching.',
      });
      return;
    }

    this.currentPage = 0;
    await this.loadRows();
  }

  async onPageChange(event: PaginatorState): Promise<void> {
    if (this.isEmbeddedMode) return;

    this.currentPage = event.page ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    await this.loadRows();
  }

  async saveRow(row: EnrollmentRow): Promise<void> {
    if (!row.isDirty || row.isSaving) return;

    const payload: EditableEnrollmentSnapshot = {
      id: row.id,
      beneficiaryId: row.beneficiaryId,
      interestedInParticipating: !!row.interestedInParticipating,
      survivesTargeting: !!row.survivesTargeting,
      treatmentArm: !!row.treatmentArm,
      householdEnrollmentStatus: !!row.householdEnrollmentStatus,
      reasonForWhyNotEnrolled: row.reasonForWhyNotEnrolled ?? '',
      groupId: Number(row.groupId) || 0,
      nomineeIndex: Number(row.nomineeIndex) || 0,
    };

    row.isSaving = true;
    this.cdr.detectChanges();

    try {
      const res = await this.api.POST(this.saveEndpoint, payload);
      const data = res?.data;

      if (!this.isApiSuccess(data)) {
        throw new Error(data?.message || 'Save failed');
      }

      this.originalRows.set(row.id, { ...payload });
      row.groupId = payload.groupId;
      row.nomineeIndex = payload.nomineeIndex;
      row.reasonForWhyNotEnrolled = payload.reasonForWhyNotEnrolled;
      row.isDirty = false;

      this.msg.add({
        severity: 'success',
        summary: 'Updated',
        detail: `Enrollment row for ${row.respondentFullName || row.applicationId || row.id} updated successfully.`,
      });
    } catch (err) {
      console.error('Failed to save beneficiary enrollment row', err);
      this.showError('Unable to save the selected row.');
      this.refreshDirtyState(row);
    } finally {
      row.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  onRowValueChange(row: EnrollmentRow): void {
    row.groupId = this.normalizeNumber(row.groupId);
    row.nomineeIndex = this.normalizeNumber(row.nomineeIndex);
    row.reasonForWhyNotEnrolled = row.reasonForWhyNotEnrolled ?? '';
    this.refreshDirtyState(row);
  }

  resetFilters(): void {
    if (this.isEmbeddedMode) return;

    this.filters = this.createDefaultFilters();
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.rows = [];
    this.totalRecords = 0;
    this.currentPage = 0;
  }

  async loadGroups(): Promise<void> {
    try {
      this.isLoadingGroups = true;
      const res = await this.api.GET<GroupApiResponse>(this.groupEndpoint);
      const data = res?.data;

      if (!this.isApiSuccess(data, Array.isArray(data?.content))) {
        throw new Error(data?.message || 'Unable to load groups');
      }

      const content = Array.isArray(data?.content) ? data.content : [];
      this.groups = content
        .map((item: GroupRecord) => ({
          id: this.normalizeNumber(item.id),
          name: item.groupName?.trim() || item.name?.trim() || `Group ${item.id}`,
        }))
        .filter((item) => item.id > 0);
    } catch (err) {
      console.error('Failed to load groups', err);
      this.showError('Unable to load groups.');
      this.groups = [];
    } finally {
      this.isLoadingGroups = false;
      this.cdr.detectChanges();
    }
  }

  private async loadRows(): Promise<void> {
    try {
      this.isLoading = true;
      this.isSearching = true;
      this.cdr.detectChanges();

      const payload = this.createSearchPayload();
      const endpoint = `${this.getEndpoint}?page=${this.currentPage}&size=${this.pageSize}`;
      const res = await this.api.POST<EnrollmentApiResponse>(
        endpoint,
        payload
      );
      const data = res?.data;

      const hasEmptySearchPayload =
        data?.code == null &&
        data?.message == null &&
        data?.content == null;

      if (!this.isApiSuccess(data, Array.isArray(data?.content) || hasEmptySearchPayload)) {
        throw new Error(data?.message || 'Unable to load beneficiary enrollment list');
      }

      const content = Array.isArray(data?.content) ? data.content : [];
      this.rows = content.map((item) => this.toRow(item));
      this.totalRecords = Number(data?.totalElements ?? content.length ?? 0);
      this.currentPage = Number(data?.pageNumber ?? this.currentPage ?? 0);
      this.pageSize = Number(data?.pageSize ?? this.pageSize ?? 10) || 10;
      this.snapshotRows(this.rows);
    } catch (err) {
      console.error('Failed to load beneficiary enrollment list', err);
      this.rows = [];
      this.totalRecords = 0;
      this.showError('Unable to load beneficiary enrollment data.');
    } finally {
      this.isLoading = false;
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  private createDefaultFilters(): EnrollmentFilters {
    return {
      groupId: null,
      stateId: null,
      countyId: null,
      payamId: null,
      bomaId: null,
    };
  }

  private createSearchPayload(): EnrollmentSearchPayload {
    const payload: EnrollmentSearchPayload = {
      groupId: this.normalizeNumber(this.filters.groupId),
    };

    if (this.filters.stateId) payload.stateId = this.normalizeNumber(this.filters.stateId);
    if (this.filters.countyId) payload.countyId = this.normalizeNumber(this.filters.countyId);
    if (this.filters.payamId) payload.payamId = this.normalizeNumber(this.filters.payamId);
    if (this.filters.bomaId) payload.bomaId = this.normalizeNumber(this.filters.bomaId);

    return payload;
  }

  private toRow(item: EnrollmentRecord): EnrollmentRow {
    return {
      id: this.normalizeNumber(item.id),
      beneficiaryId: this.normalizeNumber(item.beneficiaryId),
      applicationId: item.applicationId ?? '',
      respondentFullName: item.respondentFullName ?? '',
      respondentAge: this.normalizeNumber(item.respondentAge),
      interestedInParticipating: !!item.interestedInParticipating,
      survivesTargeting: !!item.survivesTargeting,
      treatmentArm: !!item.treatmentArm,
      householdEnrollmentStatus: !!item.householdEnrollmentStatus,
      reasonForWhyNotEnrolled: item.reasonForWhyNotEnrolled ?? '',
      groupId: this.normalizeNumber(item.groupId),
      groupName: item.groupName ?? '',
      nomineeIndex: this.normalizeNumber(item.nomineeIndex),
      isDirty: false,
      isSaving: false,
    };
  }

  private snapshotRows(rows: EnrollmentRow[]): void {
    this.originalRows.clear();
    rows.forEach((row) => {
      this.originalRows.set(row.id, this.toEditableSnapshot(row));
    });
  }

  private refreshDirtyState(row: EnrollmentRow): void {
    const original = this.originalRows.get(row.id);
    if (!original) {
      row.isDirty = false;
      return;
    }

    const current = this.toEditableSnapshot(row);
    row.isDirty =
      original.interestedInParticipating !== current.interestedInParticipating ||
      original.survivesTargeting !== current.survivesTargeting ||
      original.treatmentArm !== current.treatmentArm ||
      original.householdEnrollmentStatus !== current.householdEnrollmentStatus ||
      original.reasonForWhyNotEnrolled !== current.reasonForWhyNotEnrolled ||
      original.groupId !== current.groupId ||
      original.nomineeIndex !== current.nomineeIndex;
  }

  private toEditableSnapshot(row: EnrollmentRecord): EditableEnrollmentSnapshot {
    return {
      id: row.id,
      beneficiaryId: row.beneficiaryId,
      interestedInParticipating: !!row.interestedInParticipating,
      survivesTargeting: !!row.survivesTargeting,
      treatmentArm: !!row.treatmentArm,
      householdEnrollmentStatus: !!row.householdEnrollmentStatus,
      reasonForWhyNotEnrolled: (row.reasonForWhyNotEnrolled ?? '').trim(),
      groupId: this.normalizeNumber(row.groupId),
      nomineeIndex: this.normalizeNumber(row.nomineeIndex),
    };
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
