import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import Swal from 'sweetalert2';
import { ApiService } from '../../../../services/api.service';
import { ITRequest, ItSupportService } from '../../../../services/it-support.service';

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

@Component({
  selector: 'app-help-desk-request-assignment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PaginatorModule,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './help-desk-request-assignment.html',
  styleUrls: ['./help-desk-request-assignment.scss'],
})
export class HelpDeskRequestAssignment {
  @Input() request: ITRequest | null = null;
  @Output() assigned = new EventEmitter<ITRequest>();

  assignDialogVisible = false;
  isUserSearchLoading = false;
  isAssigning = false;
  selectedAssignee: AssignableUser | null = null;
  assignableUsers: AssignableUser[] = [];
  roles: SupportRole[] = [];
  userTotalRecords = 0;
  userCurrentPage = 0;
  userPageSize = 10;
  userFilters = {
    email: '',
    username: '',
    roleId: null as number | null,
  };

  constructor(
    private apiService: ApiService,
    private itSupportService: ItSupportService,
    private cdr: ChangeDetectorRef
  ) {}

  private getCurrentUser(): any {
    return this.apiService.loginState()?.user || {};
  }

  canAssignRequests(): boolean {
    const user = this.getCurrentUser();
    return Number(user?.roleId) === 1;
  }

  hasAssignedUser(request?: ITRequest | null): boolean {
    const assignedTo = request?.assignedTo;
    return !!(
      (assignedTo && typeof assignedTo === 'object') ||
      request?.assignedUserName ||
      request?.assignedToName ||
      request?.assigneeName ||
      request?.assignedUserId ||
      (typeof assignedTo === 'number' && assignedTo > 0) ||
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

  async openAssignDialog(): Promise<void> {
    if (!this.request || !this.canAssignRequests()) return;

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
    if (!this.request || !this.selectedAssignee) {
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
      const result = await this.itSupportService.assignRequest(this.request.id, this.selectedAssignee.id);

      if (result.success) {
        const updatedRequest = this.mergeAssignedRequest(this.request, this.selectedAssignee, result.request);
        this.request = updatedRequest;
        this.assigned.emit(updatedRequest);
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
      this.selectedAssignee = null;
      this.cdr.detectChanges();
    }
  }

  private mergeAssignedRequest(request: ITRequest, user: AssignableUser, updatedRequest?: ITRequest): ITRequest {
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
  }
}
