import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../../services/api.service';
import { FormsModule } from '@angular/forms';
import {Paginator} from 'primeng/paginator';
import {InputText} from 'primeng/inputtext';
import {Tooltip} from 'primeng/tooltip';
import {FloatLabel} from 'primeng/floatlabel';
import {Select} from 'primeng/select';
import {Dialog} from 'primeng/dialog';


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
    ToastModule,
    Loader,
    Paginator,
    InputText,
    Tooltip,
    FloatLabel,
    Select,
    Dialog,
  ],
  providers: [MessageService],
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
    roleId: '',
    emailReceiver: ''
  };

  home = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items = [{ label: 'User List', icon: 'fas fa-users' }];


  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService,
    private router: Router
  ) {}

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

  async loadUsers(): Promise<void> {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const params = {
        page: this.currentPage,
        size: this.pageSize,
        email: this.filters.email || undefined,
        username: this.filters.username || undefined,
        roleId: this.filters.roleId || undefined,
        emailReceiver: this.filters.emailReceiver || undefined,
      };

      const res = await this.api.GET('/api/users/findAllUsers', params, 'alt');
      const data = res.data || {};

      this.users = Array.isArray(data.content)
        ? data.content.map((u: any) => ({
          ...u,
          statusText: u.status ? 'ACTIVE' : 'INACTIVE',
          roleName: u.role || '-',
          emailReceiverText: u.emailReceiver ? 'Yes' : 'No'
        }))
        : [];

      this.totalRecords = data.totalElements ?? this.users.length;

    } catch (err: any) {
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
    this.currentPage = Math.floor(event.first / event.rows); // fix index
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
      roleId: '',
      emailReceiver: ''
    };
    this.currentPage = 0;
    //this.loadUsers();
  }

  /** ✅ Navigation methods */
  goToRegister() {
    this.router.navigate(['/pages/user-management/register']);
  }

  /** View User in Popup */
  async viewUser(user: any) {
    try {
      const res = await this.api.GET(`/api/users/findOne`, { id: user.id }, 'alt');
      if (res.data) {
        this.selectedUser = res.data;
        this.showUserDetailsDialog = true; // Show the dialog with user details
        this.cdr.detectChanges();
      }
    } catch (err) {
      console.error('Failed to load user details', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load user details.',
      });
    }
  }

  /** Close user details dialog */
  closeUserDetailsDialog() {
    this.showUserDetailsDialog = false;
  }

  editUser(user: any) {
    this.router.navigate(['/pages/user-management/register'], {
      queryParams: { id: user.id},
    });
  }
}

