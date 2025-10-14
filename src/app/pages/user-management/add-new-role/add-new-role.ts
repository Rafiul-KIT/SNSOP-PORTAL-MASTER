import { Component } from '@angular/core';
import {MenuItem, MessageService} from 'primeng/api';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {LookupService} from '../../../../services/lookup.service';
import {ApiService} from '../../../../services/api.service';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {Loader} from '../../../components/loader/loader';
import {Checkbox} from 'primeng/checkbox';

@Component({
  selector: 'app-add-new-role',
  imports: [
    Loader,
    ReactiveFormsModule,
    Checkbox,
    FormsModule
  ],
  templateUrl: './add-new-role.html',
  styleUrl: './add-new-role.scss'
})
export class AddNewRole {
  isLoading: boolean = true;
  items: MenuItem[] | undefined;
  home: MenuItem | undefined;
  userRoleDetails: any = null;
  availabaleRoleList: any = [];
  userRoleForm!: FormGroup;

  constructor(

    private fb: FormBuilder,
    private router: Router,
    public lookupService: LookupService,
    private apiService: ApiService,
    private messageService: MessageService,
    public ref: DynamicDialogRef,
    private conf: DynamicDialogConfig
  ) {this.userRoleForm = this.fb.group({
    roleName: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/), Validators.minLength(3)]],
    roleDescription: [''],
  }); }

  renderEditForm = (userRoleDetails: any) => {
    this.userRoleForm.patchValue({
      roleName: userRoleDetails.roleName,
      roleDescription: userRoleDetails.roleDescription
    });
    if (userRoleDetails.operationEnum != null && userRoleDetails.operationEnum.length > 0) {
      userRoleDetails.operationEnum.forEach((permission: any) => {
        this.availabaleRoleList.forEach((elm: any) => {
          if (elm.value == permission) {
            elm.checked = true;
          }
        });
      });
    }
    this.isLoading = false;
  }

  getSelectedPermission = (state: boolean, elm: any) => {
    // console.log(state);
    // console.log(elm);
    let selectedRoleList: any = [...this.availabaleRoleList];
    if (state) {
      if (elm == "ALL") {
        selectedRoleList.forEach((element: any) => {
          element.checked = true;
        });
      } else {
        selectedRoleList.forEach((element: any) => {
          if (element.value == elm) {
            element.checked = true;
          }
        });
        const checkedPermissions = selectedRoleList.filter((arl: any) => arl.checked);
        if (checkedPermissions.length >= 15) {
          selectedRoleList[0].checked = true;
        }
      }
    } else {
      if (elm == "ALL") {
        selectedRoleList.forEach((element: any) => {
          element.checked = false;
        });
      } else {
        selectedRoleList.forEach((element: any) => {
          if (element.value == elm) {
            element.checked = false;
          }
        });
        const checkedPermissions = selectedRoleList.filter((arl: any) => arl.checked);
        // console.log(checkedPermissions);
        if (checkedPermissions.length < 16) {
          selectedRoleList[0].checked = false;
        }
      }
    }

    this.availabaleRoleList = [...selectedRoleList];
    // console.log(this.availabaleRoleList);
  }

  formHandler = (type: any) => {
    this.isLoading = true;
    const checkedPermission = this.availabaleRoleList.filter((arl: any) => arl.checked);
    // console.log(checkedPermission);
    if (checkedPermission.length > 0) {
      // console.log('payload ---------->', this.userRoleForm.value);
      let endpoint: string = '';
      let payload: any = this.userRoleForm.value;
      if (this.userRoleDetails != null) {
        endpoint = 'api/role/updateRole';
        payload.roleId = this.userRoleDetails.id;
        payload.operationEnum = checkedPermission.map((cp: any) => cp.value);
      } else {
        endpoint = 'api/role/createRole';
        payload.operationEnum = checkedPermission.map((cp: any) => cp.value);
      }
      this.apiService
        .POST(endpoint, payload)
        .then((res) => {
          // console.log('register -----------> ', res);
          if (res.status === 200) {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: this.userRoleDetails == null ? 'Role Added Successfull.' : 'Role Updated Successfully', life: 2000 });
            if (type == 1) {
              this.ref.close(true);
            } else if (type == 2) {
              this.userRoleForm.reset();
            } else {
              this.ref.close(true);
            }
            this.isLoading = false;
          }
        })
        .catch((err) => {
          console.log(err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.response.data.errors[0], life: 2000 });
          this.isLoading = false;
        });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No Permission is Selected.', life: 2000 });
    }
  }

  ngOnInit(): void {
    this.home = { label: 'Dashboard', icon: 'fas fa-home me-2', routerLink: '/admin/dashboard' };
    const rawRoleList = this.lookupService.getUserPermissionEnum();
    rawRoleList.forEach((elm: any) => {
      elm.checked = false;
    });
    this.availabaleRoleList = rawRoleList;
    const deviceInfo = this.conf.data;
    // console.log(deviceInfo);
    if (deviceInfo) {
      this.userRoleDetails = deviceInfo;
      this.renderEditForm(this.userRoleDetails);
    } else {
      this.isLoading = false;
    }
  }
}
