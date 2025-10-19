import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem, MessageService } from 'primeng/api';
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
      // field names consistent with template
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

  /** ✅ Prefill form and checkbox states when editing */
  renderEditForm = (userRoleDetails: any) => {
    if (!userRoleDetails) return;

    // Some APIs return 'name' and 'description', not 'roleName'
    this.userRoleForm.patchValue({
      roleName: userRoleDetails.name || userRoleDetails.roleName || '',
      roleDescription: userRoleDetails.description || userRoleDetails.roleDescription || ''
    });

    // pre-check permissions if any
    if (userRoleDetails.operationEnum?.length) {
      userRoleDetails.operationEnum.forEach((permission: any) => {
        this.availabaleRoleList.forEach((elm: any) => {
          if (elm.value === permission) elm.checked = true;
        });
      });
    }

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  /** ✅ Checkbox logic */
  getSelectedPermission = (state: boolean, elm: any) => {
    const selectedRoleList = [...this.availabaleRoleList];

    if (state) {
      if (elm === 'ALL') {
        selectedRoleList.forEach(el => el.checked = true);
      } else {
        selectedRoleList.forEach(el => { if (el.value === elm) el.checked = true; });
        const checked = selectedRoleList.filter(arl => arl.checked);
        if (checked.length >= 15) selectedRoleList[0].checked = true;
      }
    } else {
      if (elm === 'ALL') {
        selectedRoleList.forEach(el => el.checked = false);
      } else {
        selectedRoleList.forEach(el => { if (el.value === elm) el.checked = false; });
        const checked = selectedRoleList.filter(arl => arl.checked);
        if (checked.length < 16) selectedRoleList[0].checked = false;
      }
    }

    this.availabaleRoleList = [...selectedRoleList];
  }

  /** ✅ Create or update */
  formHandler = async (type: 1 | 2 | null) => {
    this.isLoading = true;
    const checkedPermission = this.availabaleRoleList.filter((arl: any) => arl.checked);

    if (checkedPermission.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No Permission is Selected.',
        life: 2000
      });
      this.isLoading = false;
      return;
    }

    const payload: any = {
      ...this.userRoleForm.value,
      operationEnum: checkedPermission.map((cp: any) => cp.value)
    };

    let endpoint = 'api/roles/createRole';
    if (this.userRoleDetails) {
      endpoint = 'api/roles/updateRole';
      payload.roleId = this.userRoleDetails.id;
    }

    try {
      const res = await this.apiService.POST(endpoint, payload, 'alt');
      if (res.status === 200) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.userRoleDetails ? 'Role Updated Successfully' : 'Role Added Successfully.',
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
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.error?.message || err?.message || 'Request failed'
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  closeDialog(): void {
    this.ref.close();
  }

  /** ✅ Init logic */
  ngOnInit(): void {
    // populate available permissions
    const rawRoleList = this.lookupService.getUserPermissionEnum();
    rawRoleList.forEach((elm: any) => { elm.checked = false; });
    this.availabaleRoleList = rawRoleList;

    // receive dialog data
    const roleData = this.conf.data;
    if (roleData) {
      this.userRoleDetails = roleData;
      this.renderEditForm(this.userRoleDetails);
    } else {
      this.isLoading = false;
    }
  }
}
