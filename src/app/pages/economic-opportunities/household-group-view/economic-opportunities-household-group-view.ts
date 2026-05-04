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
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../../services/api.service';

interface GroupFormModel {
  groupName: string;
  latitude: number | null;
  longitude: number | null;
  vlsaFormed: boolean;
}

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

@Component({
  selector: 'app-economic-opportunities-household-group-view',
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
    RadioButtonModule,
    TableModule,
    Toast,
  ],
  providers: [MessageService],
  templateUrl: './economic-opportunities-household-group-view.html',
  styleUrl: './economic-opportunities-household-group-view.scss',
})
export class EconomicOpportunitiesHouseholdGroupView implements OnInit {
  private readonly saveEndpoint = '/api/econ-op/group/save';
  private readonly getEndpoint = '/api/econ-op/group/get';

  isLoading = false;
  isSaving = false;
  isSearching = false;

  groups: GroupRecord[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  form: GroupFormModel = this.createDefaultForm();

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Household Group View', icon: 'fas fa-object-group' },
  ];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    this.searchGroups();
  }

  async saveGroup(): Promise<void> {
    if (!this.form.groupName.trim()) {
      this.msg.add({
        severity: 'warn',
        summary: 'Group Name Required',
        detail: 'Please provide a group name before saving.',
      });
      return;
    }

    const payload = {
      groupName: this.form.groupName.trim(),
      latitude: this.normalizeNullableNumber(this.form.latitude),
      longitude: this.normalizeNullableNumber(this.form.longitude),
      vlsaFormed: !!this.form.vlsaFormed,
    };

    if (payload.latitude == null || payload.longitude == null) {
      this.msg.add({
        severity: 'warn',
        summary: 'Coordinates Required',
        detail: 'Please provide both latitude and longitude before saving.',
      });
      return;
    }

    try {
      this.isSaving = true;
      this.cdr.detectChanges();

      const res = await this.api.POST(this.saveEndpoint, payload);
      const data = res?.data;

      if (!this.isApiSuccess(data)) {
        throw new Error(data?.message || 'Unable to save group');
      }

      this.msg.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Group information saved successfully.',
      });

      this.form = this.createDefaultForm();
      await this.searchGroups();
    } catch (err) {
      console.error('Failed to save group', err);
      this.showError('Unable to save group data.');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async searchGroups(): Promise<void> {
    this.currentPage = 0;
    await this.loadGroups();
  }

  async onPageChange(event: PaginatorState): Promise<void> {
    this.currentPage = event.page ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    await this.loadGroups();
  }

  resetForm(): void {
    this.form = this.createDefaultForm();
  }

  private async loadGroups(): Promise<void> {
    try {
      this.isLoading = true;
      this.isSearching = true;
      this.cdr.detectChanges();

      const params = {
        pageNumber: this.currentPage,
        pageSize: this.pageSize,
      };

      const res = await this.api.GET<GroupListResponse>(this.getEndpoint, params);
      const data = res?.data;

      const hasEmptyPayload =
        data?.code == null &&
        data?.message == null &&
        data?.content == null;

      if (!this.isApiSuccess(data, Array.isArray(data?.content) || hasEmptyPayload)) {
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
      this.totalRecords = Number(data?.totalElements ?? content.length ?? 0);
      this.currentPage = Number(data?.pageNumber ?? this.currentPage ?? 0);
      this.pageSize = Number(data?.pageSize ?? this.pageSize ?? 10);
    } catch (err) {
      console.error('Failed to load groups', err);
      this.groups = [];
      this.totalRecords = 0;
      this.showError('Unable to load group data.');
    } finally {
      this.isLoading = false;
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  private createDefaultForm(): GroupFormModel {
    return {
      groupName: '',
      latitude: null,
      longitude: null,
      vlsaFormed: false,
    };
  }

  private normalizeNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
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
