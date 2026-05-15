import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import Swal from 'sweetalert2';
import { Loader } from '../../../components/loader/loader';
import { IT_SUPPORT_ISSUE_TYPE_OPTIONS, IT_SUPPORT_PRIORITY_OPTIONS, ITCategory, ITModule, ITRequest, ITSubmodule, ItSupportService } from '../../../../services/it-support.service';
import { ApiService } from '../../../../services/api.service';


type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

type WorkflowAction = {
  label: string;
  value: string;
  needsComment: boolean;
  actionType: 'status' | 'submit_info';
};

type SupportRole = {
  id: number;
  name: string;
  description?: string;
  status?: boolean;
};

type AssignableUser = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
  status: string | boolean;
  emailReceiver: boolean;
  isMobile?: boolean;
  statusText?: string;
  emailReceiverText?: string;
};

type LookupOption = {
  label: string;
  value: number;
};

@Component({
  selector: 'app-help-desk-support-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    TableModule,
    TagModule,
    SelectModule,
    InputTextModule,
    DialogModule,
    PaginatorModule,
    Loader,
  ],
  templateUrl: './help-desk-support-management.html',
  styleUrls: ['./help-desk-support-management.scss'],
})
export class HelpDeskSupportManagement implements OnInit {
  private readonly MIS_FIRM_ROLE_IDS = [1, 51];

  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Helpdesk' }, { label: 'Support Management' }];

  isLoading = false;
  searchText = '';
  trackingNumber = '';
  selectedStatus: string | null = null;
  selectedPriority: string | null = null;
  selectedIssueType: string | null = null;
  selectedCategoryId: number | null = null;
  selectedModuleId: number | null = null;
  selectedSubmoduleId: number | null = null;
  selectedAssignedTo: number | null = null;
  currentPage = 0;
  pageSize = 20;
  totalRecords = 0;
  assignDialogVisible = false;
  isUserSearchLoading = false;
  isAssigning = false;
  selectedRequestForAssign: ITRequest | null = null;
  selectedAssignee: AssignableUser | null = null;
  assignableUsers: AssignableUser[] = [];
  roles: SupportRole[] = [];
  categories: LookupOption[] = [];
  modules: LookupOption[] = [];
  submodules: Array<LookupOption & { parentModuleId: number }> = [];
  assignedUserOptions: LookupOption[] = [];
  userTotalRecords = 0;
  userCurrentPage = 0;
  userPageSize = 10;
  userFilters = {
    email: '',
    username: '',
    roleId: null as number | null,
  };

  statuses = [
    { label: 'All', value: null },
    { label: 'New', value: 'NEW' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Required More Info', value: 'REQUIRED_MORE_INFO' },
    { label: 'Addressed', value: 'ADDRESSED' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Reopened', value: 'REOPENED' },
  ];

  priorityOptions = [
    { label: 'All', value: null },
    ...IT_SUPPORT_PRIORITY_OPTIONS,
  ];

  issueTypeOptions = [
    { label: 'All', value: null },
    ...IT_SUPPORT_ISSUE_TYPE_OPTIONS,
  ];

  requests: ITRequest[] = [];

  constructor(
    private itSupportService: ItSupportService,
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFilterLookups();
    this.loadRequests();
  }

  async loadRequests(useFilters: boolean = true, showLoader: boolean = true): Promise<void> {
    if (showLoader) {
      this.isLoading = true;
      this.cdr.detectChanges();
    }

    const params: any = { page: this.currentPage, size: this.pageSize };
    if (useFilters) {
      if (this.selectedStatus) params.status = this.selectedStatus;
      if (this.selectedPriority) params.priority = this.selectedPriority;
      if (this.selectedIssueType) params.issueType = this.selectedIssueType;
      if (this.selectedCategoryId) params.categoryId = this.selectedCategoryId;
      if (this.selectedModuleId) params.moduleId = this.selectedModuleId;
      if (this.selectedSubmoduleId) params.submoduleId = this.selectedSubmoduleId;
      if (this.selectedAssignedTo) params.assignedTo = this.selectedAssignedTo;
      if (this.trackingNumber.trim()) params.trackingNumber = this.trackingNumber.trim();
      if (this.searchText.trim()) params.search = this.searchText.trim();
    }

    try {
      const result = await this.itSupportService.getRequests(params);
      this.requests = result.items;
      this.totalRecords = result.total;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading support requests:', error);
      this.requests = [];
      this.totalRecords = 0;
      this.cdr.detectChanges();
    } finally {
      if (showLoader) {
        this.isLoading = false;
      }
      this.cdr.detectChanges();
    }
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadRequests();
  }

  resetFilters(): void {
    this.searchText = '';
    this.trackingNumber = '';
    this.selectedStatus = null;
    this.selectedPriority = null;
    this.selectedIssueType = null;
    this.selectedCategoryId = null;
    this.selectedModuleId = null;
    this.selectedSubmoduleId = null;
    this.selectedAssignedTo = null;
    this.applyFilters();
  }

  onRequestPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadRequests();
  }

  onModuleFilterChange(): void {
    this.selectedSubmoduleId = null;
  }

  get filteredSubmoduleOptions(): Array<LookupOption & { parentModuleId: number }> {
    if (!this.selectedModuleId) return this.submodules;
    return this.submodules.filter((submodule) => Number(submodule.parentModuleId) === Number(this.selectedModuleId));
  }

  private async loadFilterLookups(): Promise<void> {
    try {
      const [categories, modules, submodules] = await Promise.all([
        this.itSupportService.getCategories(),
        this.itSupportService.getModules(),
        this.itSupportService.getSubmodules(),
      ]);

      this.categories = categories.map((category: ITCategory) => ({ label: category.name, value: category.id }));
      this.modules = modules.map((module: ITModule) => ({ label: module.name, value: module.id }));
      this.submodules = submodules.map((submodule: ITSubmodule) => ({
        label: submodule.name,
        value: submodule.id,
        parentModuleId: submodule.parentModuleId,
      }));
      await this.loadAssignedUserOptions();
    } catch (error) {
      console.error('Failed to load support request filters:', error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  getStatusSeverity(status: string | undefined): Severity {
    switch (status?.toUpperCase()) {
      case 'NEW':
        return 'info';
      case 'PROCESSING':
        return 'warn';
      case 'REQUIRED_MORE_INFO':
        return 'danger';
      case 'ADDRESSED':
        return 'secondary';
      case 'RESOLVED':
      case 'CLOSED':
        return 'success';
      case 'REOPENED':
        return 'contrast';
      default:
        return 'secondary';
    }
  }

  getPrioritySeverity(priority: string | undefined): Severity {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warn';
      case 'LOW':
        return 'info';
      default:
        return 'secondary';
    }
  }

  formatStatus(status?: string): string {
    if (!status) return '--';
    return status.replace(/_/g, ' ');
  }

  getCategoryDisplay(request?: ITRequest | null): string {
    if (!request) return '--';
    const categoryName = request.categoryName || '--';
    const otherCategory = String(request.otherCategory || '').trim();
    return otherCategory ? `${categoryName} (${otherCategory})` : categoryName;
  }

  formatIssueType(issueType?: string): string {
    if (!issueType) return '--';
    return issueType.replace(/_/g, ' ');
  }

  hasAssignedUser(request?: ITRequest | null): boolean {
    const assigned = request?.assignedTo;
    return !!(
      (assigned && typeof assigned === 'object') ||
      request?.assignedUserName ||
      request?.assignedToName ||
      request?.assigneeName ||
      request?.assignedUserId ||
      (typeof assigned === 'number' && assigned > 0) ||
      request?.assigneeId
    );
  }

  getAssignButtonLabel(request?: ITRequest | null): string {
    return this.hasAssignedUser(request) ? 'Reassign' : 'Assign';
  }

  getAssignedUserDisplay(request?: ITRequest | null): string {
    if (!request) return 'Unassigned';
    const assignedTo = request.assignedTo;

    if (assignedTo && typeof assignedTo === 'object') {
      return assignedTo.fullName || assignedTo.username || 'Assigned';
    }

    return (
      request.assignedUserName ||
      request.assignedToName ||
      request.assigneeName ||
      (request.assignedUserId || assignedTo || request.assigneeId ? `User #${request.assignedUserId || assignedTo || request.assigneeId}` : 'Unassigned')
    );
  }

  getAssignedMetaDisplay(request?: ITRequest | null): string {
    if (!request) return '';
    const assignedTo = request.assignedTo;

    if (assignedTo && typeof assignedTo === 'object') {
      return assignedTo.email || '';
    }

    const parts = [request.assignedUserRole, request.assignedUserEmail].filter(Boolean);
    return parts.join(' | ');
  }

  private getCurrentUser(): any {
    return this.apiService.loginState()?.user || {};
  }

  private getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    const raw = user?.userId ?? user?.id ?? user?.uid ?? user?.sub ?? null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private isMisFirmUser(): boolean {
    const user = this.getCurrentUser();
    const roleId = Number(user?.roleId);
    const roleName = String(user?.roleName || user?.role || '').toUpperCase();

    return (
      this.MIS_FIRM_ROLE_IDS.includes(roleId) ||
      roleName.includes('MIS_FIRM') ||
      roleName.includes('MIS FIRM')
    );
  }

  canAssignRequests(): boolean {
    const user = this.getCurrentUser();
    return Number(user?.roleId) === 1;
  }

  private isRequestCreator(request?: ITRequest | null): boolean {
    if (!request) return false;
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return false;
    return Number(request.createdBy) === currentUserId;
  }

  private canTransition(fromStatus?: string, toStatus?: string): boolean {
    const from = String(fromStatus || '').toUpperCase();
    const to = String(toStatus || '').toUpperCase();
    const isMisFirm = this.isMisFirmUser();

    if (!from || !to) return false;

    if (isMisFirm) {
      return (
        (from === 'NEW' && to === 'PROCESSING') ||
        (from === 'PROCESSING' && ['REQUIRED_MORE_INFO', 'ADDRESSED', 'CLOSED'].includes(to)) ||
        (from === 'REOPENED' && to === 'PROCESSING')
        // ||
        // (from === 'CLOSED' && to === 'REOPENED')
      );
    }

    return (
      (from === 'ADDRESSED' && to === 'RESOLVED') ||
      (from === 'RESOLVED' && to === 'CLOSED') ||
      (from === 'CLOSED' && to === 'REOPENED')
    );
  }

  getAvailableActions(request: ITRequest): WorkflowAction[] {
    const isMisFirm = this.isMisFirmUser();
    const status = request.status?.toUpperCase() || '';

    if (isMisFirm) {
      switch (status) {
        case 'NEW':
          return [{ label: 'Move to Processing', value: 'PROCESSING', needsComment: false, actionType: 'status' }];
        case 'PROCESSING':
          return [
            { label: 'Ask For More Info', value: 'REQUIRED_MORE_INFO', needsComment: true, actionType: 'status' },
            { label: 'Mark Addressed', value: 'ADDRESSED', needsComment: false, actionType: 'status' },
            { label: 'Close', value: 'CLOSED', needsComment: true, actionType: 'status' },
          ];
        case 'REOPENED':
          return [{ label: 'Move to Processing', value: 'PROCESSING', needsComment: false, actionType: 'status' }];
          //   case 'CLOSED':
          // return [{ label: 'Reopen', value: 'REOPENED', needsComment: true, actionType: 'status' }];
        default:
          return [];
      }
    }

    if (!this.isRequestCreator(request)) return [];

    switch (status) {
      case 'REQUIRED_MORE_INFO':
        return [{ label: 'Submit Required Info', value: 'PROCESSING', needsComment: false, actionType: 'submit_info' }];
      case 'ADDRESSED':
        return [{ label: 'Mark Resolved', value: 'RESOLVED', needsComment: false, actionType: 'status' }];
      case 'RESOLVED':
        return [{ label: 'Close', value: 'CLOSED', needsComment: true, actionType: 'status' }];
      case 'CLOSED':
        return [{ label: 'Reopen', value: 'REOPENED', needsComment: true, actionType: 'status' }];
      default:
        return [];
    }
  }

  getWorkflowContextText(): string {
    return this.isMisFirmUser()
      ? 'MIS mode: NEW -> PROCESSING, PROCESSING -> REQUIRED_MORE_INFO/ADDRESSED/CLOSED, REOPENED -> PROCESSING'
      : 'Requester mode: REQUIRED_MORE_INFO -> submit info, ADDRESSED -> RESOLVED, RESOLVED -> CLOSED, CLOSED -> REOPENED';
  }

  getStatusActionLabel(request: ITRequest): string {
    const actions = this.getAvailableActions(request);
    if (!actions.length) return 'No Action';
    if (actions.length === 1) return actions[0].label;
    return 'Change Status';
  }

  async onView(request: ITRequest): Promise<void> {
    await this.router.navigate(['/help-desk/request-details', request.id]);
   
  }

  async navigateToSetup(): Promise<void> {
    await this.router.navigate(['/help-desk/setup']);
  }

  async openAssignDialog(request: ITRequest): Promise<void> {
    if (!this.canAssignRequests()) return;

    this.selectedRequestForAssign = request;
    this.selectedAssignee = null;
    this.assignDialogVisible = true;
    this.userCurrentPage = 0;

    if (!this.roles.length) {
      await this.loadRoles();
    }
    await this.loadAssignableUsers();
  }

  closeAssignDialog(): void {
    if (this.isAssigning) return;

    this.assignDialogVisible = false;
    this.selectedRequestForAssign = null;
    this.selectedAssignee = null;
  }

  async loadRoles(): Promise<void> {
    try {
      const res = await this.apiService.GET<any>('/api/users/roles', {}, 'alt');
      this.roles = Array.isArray(res.data)
        ? res.data.filter((role: SupportRole) => role.status === true)
        : [];
    } catch (error) {
      console.error('Failed to load roles:', error);
      this.roles = [];
    } finally {
      this.cdr.detectChanges();
    }
  }

  private normalizeUsers(raw: any[]): AssignableUser[] {
    return (raw || []).map((user: any) => {
      const isActive =
        typeof user?.status === 'boolean'
          ? user.status
          : String(user?.status || '').toLowerCase() === 'active';

      return {
        ...user,
        id: Number(user.id),
        fullName: user.fullName || '--',
        username: user.username || '--',
        email: user.email || '--',
        role: user.role || '--',
        statusText: isActive ? 'ACTIVE' : 'INACTIVE',
        emailReceiverText: user.emailReceiver === true ? 'Yes' : user.emailReceiver === false ? 'No' : '--',
      };
    });
  }

  private async loadAssignedUserOptions(): Promise<void> {
    const payload = {
      criteria: [
        {
          fieldName: 'STATUS',
          operator: 'EQUAL',
          value: '1',
        },
      ],
      sortColumn: 'ID',
      sortOrder: 'DESC',
      page: 0,
      size: 100,
    };

    try {
      const res = await this.apiService.POST<any>('/api/users/search', payload, 'alt');
      const data = res?.data ?? {};
      const list =
        Array.isArray(data.content) ? data.content :
        Array.isArray(data.users) ? data.users :
        Array.isArray(data) ? data :
        [];

      this.assignedUserOptions = this.normalizeUsers(list).map((user) => ({
        label: `${user.fullName} (${user.email})`,
        value: user.id,
      }));
    } catch (error) {
      console.error('Failed to load assigned user filter options:', error);
      this.assignedUserOptions = [];
    }
  }

  private buildUserSearchCriteria(): any[] {
    const criteria = [
      {
        fieldName: 'STATUS',
        operator: 'EQUAL',
        value: '1',
      },
    ];

    if (this.userFilters.email.trim()) {
      criteria.push({
        fieldName: 'EMAIL',
        operator: 'LIKE',
        value: this.userFilters.email.trim(),
      });
    }

    if (this.userFilters.username.trim()) {
      criteria.push({
        fieldName: 'USER_NAME',
        operator: 'LIKE',
        value: this.userFilters.username.trim(),
      });
    }

    return criteria;
  }

  async loadAssignableUsers(): Promise<void> {
    this.isUserSearchLoading = true;
    this.cdr.detectChanges();

    const payload: any = {
      criteria: this.buildUserSearchCriteria(),
      sortColumn: 'ID',
      sortOrder: 'DESC',
      page: this.userCurrentPage,
      size: this.userPageSize,
    };

    if (this.userFilters.roleId) {
      payload.roleId = this.userFilters.roleId;
    }

    try {
      const res = await this.apiService.POST<any>('/api/users/search', payload, 'alt');
      const data = res?.data ?? {};
      const list =
        Array.isArray(data.content) ? data.content :
        Array.isArray(data.users) ? data.users :
        Array.isArray(data) ? data :
        [];

      this.assignableUsers = this.normalizeUsers(list);
      this.userTotalRecords = typeof data.total === 'number' ? data.total : this.assignableUsers.length;
    } catch (error) {
      console.error('Failed to load assignable users:', error);
      this.assignableUsers = [];
      this.userTotalRecords = 0;
      await Swal.fire({
        icon: 'error',
        title: 'User Search Failed',
        text: 'Unable to load active users for assignment.',
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isUserSearchLoading = false;
      this.cdr.detectChanges();
    }
  }

  applyUserFilters(): void {
    this.userCurrentPage = 0;
    this.loadAssignableUsers();
  }

  resetUserFilters(): void {
    this.userFilters = {
      email: '',
      username: '',
      roleId: null,
    };
    this.applyUserFilters();
  }

  onUserPageChange(event: any): void {
    this.userCurrentPage = event.page;
    this.userPageSize = event.rows;
    this.loadAssignableUsers();
  }

  selectAssignee(user: AssignableUser): void {
    this.selectedAssignee = user;
  }

  async assignSelectedUser(): Promise<void> {
    if (!this.selectedRequestForAssign || !this.selectedAssignee) {
      await Swal.fire({
        icon: 'warning',
        title: 'Select User',
        text: 'Please select an active user before assigning the request.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    this.isAssigning = true;
    this.cdr.detectChanges();

    try {
      const result = await this.itSupportService.assignRequest(
        this.selectedRequestForAssign.id,
        this.selectedAssignee.id
      );

      if (result.success) {
        this.updateAssignedRequestLocally(this.selectedRequestForAssign.id, this.selectedAssignee, result.request);
        this.assignDialogVisible = false;

        await Swal.fire({
          icon: 'success',
          title: 'Request Assigned',
          text: result.message || `Assigned to ${this.selectedAssignee.fullName}.`,
          confirmButtonColor: '#3085d6',
          timer: 1400,
          showConfirmButton: false,
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Assign Failed',
          text: result.message || 'Unable to assign the selected user.',
          confirmButtonColor: '#d33',
        });
      }
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Unexpected Error',
        text: 'Unable to assign the selected user.',
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isAssigning = false;
      this.selectedRequestForAssign = null;
      this.selectedAssignee = null;
      this.cdr.detectChanges();
    }
  }

  private updateAssignedRequestLocally(requestId: number, user: AssignableUser, updatedRequest?: ITRequest): void {
    this.requests = this.requests.map((request) => {
      if (request.id !== requestId) return request;

      return {
        ...request,
        ...(updatedRequest || {}),
        assignedUserId: user.id,
        assignedUserName: user.fullName,
        assignedUserEmail: user.email,
        assignedUserRole: user.role,
        assignedTo: {
          username: user.username,
          fullName: user.fullName,
          email: user.email,
        },
      };
    });
  }

  async onAction(request: ITRequest): Promise<void> {
    const actions = this.getAvailableActions(request);

    if (!actions.length) {
      await Swal.fire({
        icon: 'info',
        title: 'No Transition Available',
        text: this.isMisFirmUser()
          ? 'This request has no MIS workflow transition from its current status.'
          : 'No requester transition available from current status.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    let selectedAction = actions[0];

    if (actions.length > 1) {
      const { value: selectedValue } = await Swal.fire({
        title: 'Select Next Status',
        input: 'select',
        inputOptions: actions.reduce((acc, action) => {
          acc[action.value] = `${action.label} (${action.value})`;
          return acc;
        }, {} as Record<string, string>),
        inputPlaceholder: 'Select transition',
        showCancelButton: true,
        confirmButtonText: 'Continue',
        confirmButtonColor: '#3085d6',
        inputValidator: (value) => (!value ? 'Please select a status transition.' : null),
      });

      if (!selectedValue) return;
      selectedAction = actions.find((a) => a.value === selectedValue) || actions[0];
    }

    let comment = '';
    if (selectedAction.needsComment) {
      const result = await Swal.fire({
        title: 'Comment Required',
        input: 'textarea',
        inputLabel: `Provide comment for ${selectedAction.value}`,
        inputPlaceholder: 'Type workflow comment',
        showCancelButton: true,
        confirmButtonText: 'Update Status',
        confirmButtonColor: '#3085d6',
        inputValidator: (value) => (!value?.trim() ? 'Comment is required for this transition.' : null),
      });

      if (!result.isConfirmed) return;
      comment = String(result.value || '').trim();
    }

    if (selectedAction.actionType === 'submit_info') {
      const result = await Swal.fire({
        title: 'Submit Required Information',
        html: `
          <div style="text-align: left; font-family: inherit;">
            <p style="font-size: 0.9rem; color: #6c757d; margin-bottom: 1.25rem; border-bottom: 1px solid #e9ecef; padding-bottom: 0.5rem;">
              <i class="fas fa-circle-info" style="color: #3b82f6; margin-right: 6px;"></i>
              Please provide at least one of the following to update your request.
            </p>
            
            <div style="margin-bottom: 1rem;">
              <label for="submit-info-comment" style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #374151;">Workflow Comment</label>
              <textarea id="submit-info-comment" class="swal2-textarea" style="width: 100%; height: 80px; margin: 0; padding: 0.75rem; font-size: 0.9rem; border-radius: 8px; border: 1px solid #d1d5db;" placeholder="Describe your updates or response..."></textarea>
            </div>

            <div style="margin-bottom: 1rem;">
              <label for="submit-info-description" style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #374151;">Updated Description (Optional)</label>
              <textarea id="submit-info-description" class="swal2-textarea" style="width: 100%; height: 80px; margin: 0; padding: 0.75rem; font-size: 0.9rem; border-radius: 8px; border: 1px solid #d1d5db;" placeholder="If you need to update the original description..."></textarea>
            </div>

            <div style="margin-bottom: 0.5rem;">
              <label for="submit-info-files" style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #374151;">Attachments (Optional)</label>
              <input id="submit-info-files" type="file" class="swal2-file" style="width: 100%; margin: 0; font-size: 0.85rem; border: 1px solid #d1d5db; border-radius: 8px; padding: 0.5rem;" multiple />
              <div style="font-size: 0.75rem; color: #9ca3af; mt-1">Select one or more files to upload.</div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Submit Info',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6e7881',
        width: '500px',
        preConfirm: () => {
          const commentValue = String((document.getElementById('submit-info-comment') as HTMLTextAreaElement)?.value || '').trim();
          const descriptionValue = String((document.getElementById('submit-info-description') as HTMLTextAreaElement)?.value || '').trim();
          const files = Array.from((document.getElementById('submit-info-files') as HTMLInputElement)?.files || []);
          if (!commentValue && !descriptionValue && !files.length) {
            Swal.showValidationMessage('Please provide at least a comment, description, or attachment.');
            return null;
          }
          return { commentValue, descriptionValue, files };
        },
      });

      if (!result.isConfirmed || !result.value) return;

      try {
        const submitResponse = await this.itSupportService.submitInfo(
          request.id,
          {
            comment: result.value.commentValue || undefined,
            description: result.value.descriptionValue || undefined,
          },
          result.value.files || []
        );

        if (submitResponse.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Information Submitted',
            text: submitResponse.message || 'Required information submitted and status moved to PROCESSING.',
            confirmButtonColor: '#3085d6',
          });
          await this.loadRequests(true, false);
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Submit Failed',
            text: submitResponse.message || 'Unable to submit required information.',
            confirmButtonColor: '#d33',
          });
        }
      } catch {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An unexpected error occurred while submitting required information.',
          confirmButtonColor: '#d33',
        });
      } finally {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      if (!this.canTransition(request.status, selectedAction.value)) {
        await Swal.fire({
          icon: 'warning',
          title: 'Invalid Transition',
          text: `Invalid status transition from ${request.status} to ${selectedAction.value}.`,
          confirmButtonColor: '#3085d6',
        });
        return;
      }

      const response = await this.itSupportService.updateRequestStatus(request.id, {
        status: selectedAction.value,
        ...(comment ? { comment } : {}),
      });

      this.isLoading = false;
      this.cdr.detectChanges();

      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: response.message || 'Request status updated successfully.',
          confirmButtonColor: '#3085d6',
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: response.message || 'Unable to update request status.',
          confirmButtonColor: '#d33',
        });
      }
    } catch {
      this.isLoading = false;
      this.cdr.detectChanges();

      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred while updating status.',
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
      this.loadRequests();
    }
  }
}
