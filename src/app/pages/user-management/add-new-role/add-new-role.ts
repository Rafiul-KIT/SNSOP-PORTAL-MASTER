import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LookupService } from '../../../../services/lookup.service';
import { ApiService } from '../../../../services/api.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Loader } from '../../../components/loader/loader';
import { Checkbox } from 'primeng/checkbox';

@Component({
  selector: 'app-add-new-role',
  standalone: true,
  imports: [
    CommonModule,
    Loader,
    ReactiveFormsModule,
    Checkbox,
    FormsModule
  ],
  templateUrl: './add-new-role.html',
  styleUrl: './add-new-role.scss'
})
export class AddNewRole implements OnInit {
  isLoading = true;
  userRoleDetails: any = null;
  availabaleRoleList: any[] = [];
  availabaleMenuList: any[] = [];
  userRoleForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public lookupService: LookupService,
    private apiService: ApiService,
    private messageService: MessageService,
    public ref: DynamicDialogRef,
    public conf: DynamicDialogConfig,
    private cdr: ChangeDetectorRef
  ) {
    this.userRoleForm = this.fb.group({
      roleName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[A-Za-z][A-Za-z0-9 _-]*$/)
      ]],
      roleDescription: [''],
    });
  }

  get roleNameCtrl() { return this.userRoleForm.get('roleName'); }
  get roleNameErrors() { return this.roleNameCtrl?.errors || {}; }

  /** ✅ Prefill role info */
  renderEditForm = (userRoleDetails: any) => {
    if (!userRoleDetails) return;

    this.userRoleForm.patchValue({
      roleName: userRoleDetails.name || userRoleDetails.roleName || '',
      roleDescription: userRoleDetails.description || userRoleDetails.roleDescription || ''
    });

    this.isLoading = false;
    this.cdr.detectChanges();
  };

  /** ✅ Fetch menus dynamically for this role (flat list) */
  async fetchRoleMenus(roleId: number) {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      // 1️⃣ Fetch menus assigned to this role
      const res = await this.apiService.GET(`api/menus/role/${roleId}`, {}, 'alt');
      const assignedMenus = res?.data?.data || [];

      // 2️⃣ Map backend URLs → IDs for quick lookup
      const assignedMap = new Map(
        assignedMenus.map((m: any) => [m.url, m.id])
      );

      // 3️⃣ Load all menus from lookup
      const lookupMenus = this.lookupService.getUserPermissionEnum() || [];

      // 4️⃣ Merge lookup + assigned
      this.availabaleMenuList = lookupMenus.map((menu: any) => {
        const backendId = assignedMap.get(menu.value) || null;
        const isChecked = assignedMap.has(menu.value);
        return {
          id: backendId,               // ✅ Real backend menu ID
          label: menu.label,
          value: menu.value,           // 'user-management/users', etc.
          checked: isChecked,
        };
      });

    } catch (err) {
      console.error('Failed to fetch role menus:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Could not load menus for this role.'
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /** ✅ Create or update role */
  formHandler = async (type: 1 | 2 | null) => {
    this.isLoading = true;

    // 🔹 Collect checked menus
    const selectedMenus = this.availabaleMenuList.filter((m: any) => m.checked && m.id);

    if (selectedMenus.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No menu selected.',
        life: 2000
      });
      this.isLoading = false;
      return;
    }

    // 🔹 Build payload in backend's expected format
    const payload: any = {
      roleId: this.userRoleDetails?.id || null,
      roleName: this.userRoleForm.value.roleName,
      roleDescription: this.userRoleForm.value.roleDescription,
      status: true,
      menuIds: selectedMenus.map((m: any) => m.id)
    };

    // 🔹 Determine endpoint
    const endpoint = this.userRoleDetails
      ? 'api/roles/updateRole'
      : 'api/roles/createRole';

    try {
      const res = await this.apiService.POST(endpoint, payload, 'alt');

      if (res.status === 200) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.userRoleDetails
            ? 'Role Updated Successfully'
            : 'Role Added Successfully.',
          life: 2000
        });

        if (type === 1) this.ref.close(true);
        else if (type === 2) this.userRoleForm.reset();
        else this.ref.close(true);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Something went wrong. Please try again.',
          life: 2000
        });
      }
    } catch (err: any) {
      console.error('Role save error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.error?.message || err?.message || 'Request failed'
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  };

  closeDialog(): void {
    this.ref.close();
  }

  /** ✅ Init logic */
  ngOnInit(): void {
    const roleData = this.conf.data;

    if (roleData) {
      this.userRoleDetails = roleData;
      this.renderEditForm(this.userRoleDetails);
      this.fetchRoleMenus(this.userRoleDetails.id);
    } else {
      // For Add New Role
      this.isLoading = false;
      this.availabaleMenuList = this.lookupService.getUserPermissionEnum().map((m: any) => ({
        id: null,
        label: m.label,
        value: m.value,
        checked: false
      }));
    }
  }
}
