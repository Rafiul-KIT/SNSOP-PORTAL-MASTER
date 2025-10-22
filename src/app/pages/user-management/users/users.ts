import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { Toast } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { Paginator } from 'primeng/paginator';
import { InputText } from 'primeng/inputtext';
import { Tooltip } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { Dialog } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Select } from "primeng/select";





@Component({
  selector: 'app-users',
  standalone: true,
  templateUrl: './users.html',
  styleUrls: ['./users.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbModule,
    TableModule,
    ButtonModule,
    ButtonGroupModule,
    Toast,
    Loader,
    Paginator,
    InputText,
    Tooltip,
    FloatLabel,
    Dialog,
    ConfirmDialogModule,
    Select
],
  providers: [MessageService, ConfirmationService],
})
export class Users implements OnInit {

  isLoading = false;
  users: any[] = [];
  roles: any[] = [];

  // ✅ Pagination
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;
  selectedUser: any;
  showUserDetailsDialog = false;

  filters = {
    email: '',
    username: '',
    status: '',
    roleId: '',
    emailReceiver: ''
  };

  statusOptions = [
    { label: 'Active', value: 1 },
    { label: 'Inactive', value: 0 }
  ];

  home = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items = [{ label: 'User List', icon: 'fas fa-users' }];


  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  async loadRoles(): Promise<void> {
    try {
      const res = await this.api.GET('/api/users/roles', {}, 'alt');
      this.roles = Array.isArray(res.data)
        ? res.data.filter((r: any) => r.status === true)
        : [];
    } catch (err) {
      console.error('Failed to load roles', err);
    }
  }

private normalizeUsers(raw: any[]): any[] {
  return (raw || []).map((u: any) => {
    // status can be boolean or string like "Active"/"Inactive"
    const isActive =
      typeof u?.status === 'boolean'
        ? u.status
        : (String(u?.status || '').toLowerCase() === 'active');

    return {
      ...u,
      statusText: isActive ? 'ACTIVE' : 'INACTIVE',
      roleName: u?.role ?? '-',                               // role is already a string in your response
      emailReceiverText: u?.emailReceiver === true ? 'Yes'
                        : u?.emailReceiver === false ? 'No'
                        : '—',                                 // handle null/undefined
    };
  });
}

// Add this helper to your class
private buildCriteriaFromFilters(): any[] {
  const criteria: any[] = [];

  // EMAIL (LIKE)
  if (this.filters.email?.trim()) {
    criteria.push({
      fieldName: 'EMAIL',
      operator: 'LIKE',
      value: this.filters.email.trim(),
    });
  }

  // USERNAME (LIKE)
  if (this.filters.username?.trim()) {
    criteria.push({
      fieldName: 'USER_NAME',
      operator: 'LIKE',
      value: this.filters.username.trim(),
    });
  }

  // STATUS (EQUAL)
  const statusValue = this.filters.status != null
    ? String(this.filters.status) // Convert to string if it's a number
    : '1'; // Default to '1' (Active) if no status is provided
  criteria.push({
    fieldName: 'STATUS',
    operator: 'EQUAL',
    value: statusValue,
  });

  // ROLE_ID (EQUAL)
  if (this.filters.roleId !== '' && this.filters.roleId !== null && this.filters.roleId !== undefined) {
    criteria.push({
      fieldName: 'ROLE_ID',
      operator: 'EQUAL',
      value: String(this.filters.roleId),
    });
  }

  // EMAIL_RECEIVER (EQUAL)
  const er = this.filters.emailReceiver;
  if (er !== '' && er != null) {
    const boolString = (typeof er === 'boolean' ? er : String(er).toLowerCase() === 'true')
      ? 'true'
      : 'false';

    criteria.push({
      fieldName: 'EMAIL_RECEIVER',
      operator: 'EQUAL',
      value: boolString,
    });
  }

  return criteria;
}




// Replace your loadUsers() with this version
async loadUsers(): Promise<void> {
  try {
    this.isLoading = true;
    this.cdr.detectChanges();

    const payload = {
      criteria: this.buildCriteriaFromFilters(), // <-- required criteria array
      sortColumn: 'ID',                          // or make this dynamic if you add UI controls
      sortOrder: 'DESC',                         // 'ASC' | 'DESC'
      page: this.currentPage,                    // zero-based
      size: this.pageSize,                       // rows per page

    };

    const res = await this.api.POST('/api/users/search', payload, 'alt');
    const data = res?.data ?? res ?? {};

    // Support pageable or flat responses
    const list =
      Array.isArray(data.content) ? data.content :
      Array.isArray(data.users)   ? data.users   :
      Array.isArray(data)         ? data         :
      [];

    this.users = this.normalizeUsers(list);
    this.totalRecords =
      typeof data.total === 'number' ? data.total : this.users.length;

  } catch (err) {
    console.error('Failed to load users', err);
    this.msg.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Unable to load user list from server.',
    });
  } finally {
    this.isLoading = false;
    this.cdr.detectChanges();
  }
}




  /** ✅ Custom paginator handling */
  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadUsers();
  }

  /** ✅ Apply search filters */
  applyFilters() {
    this.currentPage = 0;
    this.loadUsers();
  }

  /** ✅ Reset filters */
  resetFilters() {
    this.filters = {
      email: '',
      username: '',
      status: '',
      roleId: '',
      emailReceiver: ''
    }; 
    this.applyFilters();
  }

  /** ✅ Navigation methods */
  goToRegister() {
    this.router.navigate(['/user-management/register']);
  }

  /** View User in Popup */
  async viewUser(user: any) {
    if (!user?.id) return;

    this.isLoading = true;
    // Optional: clear previous selection while loading
    this.selectedUser = null;
    this.showUserDetailsDialog = false;
    this.cdr.detectChanges();

    try {
      const res = await this.api.GET(`/api/users/findOne`, { id: user.id }, 'alt');
      if (res?.data) {
        this.selectedUser = res.data;
        this.showUserDetailsDialog = true;
        this.cdr.detectChanges();
      } else {
        this.msg.add({
          severity: 'warn',
          summary: 'Not found',
          detail: 'User details were not returned by the server.',
        });
      }
    } catch (err) {
      console.error('Failed to load user details', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load user details.',
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }


  /** Close user details dialog */
  closeUserDetailsDialog() {
    this.showUserDetailsDialog = false;
  }

  editUser(user: any) {
    this.router.navigate(['/user-management/register'], {
      queryParams: { id: user.id },
    });
  }

  deleteUser(user: any) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this user?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: async () => {
        if (!user?.id) return;
        this.isLoading = true;
        this.cdr.detectChanges();
        try {
          await this.api.DELETE(`/api/users/delete/${user.id}`, 'alt');
          this.msg.add({
            severity: 'success',
            summary: 'Success',
            detail: `User '${user.fullName}' has been deleted.`,
          });
          this.loadUsers(); // Refresh user list
        } catch (err) {
          console.error('Failed to delete user:', err);
          this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Could not delete the user. Please try again.',
          });
        } finally {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      reject: () => {},
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
    });
  }
}

