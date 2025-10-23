import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Loader } from '../../../components/loader/loader';
import { CommonModule } from "@angular/common";
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-role-link',
  standalone: true,
  imports: [ReactiveFormsModule, Loader, CommonModule, ToastModule],
  templateUrl: './role-link.html',
  styleUrls: ['./role-link.scss']
})
export class RoleLink implements OnInit {

  isLoading: boolean = false;
  roleList: any[] = [];
  userList: any[] = [];

  roleLinkForm = new FormGroup({
    roleId: new FormControl('', Validators.required),
    userId: new FormControl('', Validators.required),
    userName: new FormControl(''),
    email: new FormControl(''),
  });

  constructor(
    private apiService: ApiService,
    public ref: DynamicDialogRef,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      await Promise.all([this.fetchRoleList(), this.fetchUserList()]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  closeDialog(): void {
    this.ref.close();
  }

  // ✅ Fetch roles from /api/role/searchRole
  fetchRoleList = async () => {
    try {
      const res = await this.apiService.POST('api/roles/searchRole', { size: 1000 }, 'alt');
      console.log('Role API Response:', res);
      if (res.status === 200 && res.data) {
        this.roleList = res.data.roles || res.data.roleList || (Array.isArray(res.data) ? res.data : []);
      } else {
        this.roleList = [];
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      this.roleList = [];
      throw err; // Re-throw to be caught by Promise.all
    }
  };

  // ✅ Fetch users from /api/user/search
  fetchUserList = async () => {
    try {
      const res = await this.apiService.POST(
        'api/users/search',
        {
          size: 1000,
          /*criteria: [{ fieldName: 'STATUS', operator: 'EQUAL', value: '0' }],*/
        },
        'alt'
      );
      console.log('User API Response:', res);

      if (res.status === 200 && res.data) {
        this.userList = res.data.users || res.data.userList || (Array.isArray(res.data) ? res.data : []);
      } else {
        this.userList = [];
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      this.userList = [];
      throw err; // Re-throw to be caught by Promise.all
    }
  };

  // ✅ Handle role selection
  getRoleDetail = (roleId: string) => {
    this.roleLinkForm.patchValue({ roleId: roleId });
  };

  // ✅ Handle user selection (id-name-email format)
  getUserDetail = (userId: string) => {
    if (!userId) {
      this.roleLinkForm.patchValue({ userName: '', email: '' });
      return;
    }
    const selectedUser = this.userList.find(user => user.id === userId);
    if (selectedUser) {
      this.roleLinkForm.patchValue({
        userName: selectedUser.fullName,
        email: selectedUser.email
      });
    }
  };

  // ✅ Submit user-role linking
  roleLinkFormHandler = async () => {
    if (this.roleLinkForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please select both user and role.',
        life: 2000
      });
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    const payload = this.roleLinkForm.value;
    console.log('Link Payload:', payload);

    try {
      const res: any = await this.apiService.POST('api/roles/linkUserRole', payload, 'alt');
      const body = res?.data || {}; // body holds the actual response payload

      if (res.status === 200) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Role linked with user successfully!',
          life: 2000
        });
        this.ref.close(true);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: body.message || 'Failed to link role.',
          life: 2000
        });
      }
    } catch (err: any) {
      console.error('Error linking role:', err);
      const detail =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0] ||
        'Unknown error occurred.';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail,
        life: 2000
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }

  };
}
