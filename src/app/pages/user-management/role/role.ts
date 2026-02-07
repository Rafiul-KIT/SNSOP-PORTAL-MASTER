import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { ApiService } from '../../../../services/api.service';
import { LookupService } from '../../../../services/lookup.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Loader } from "../../../components/loader/loader";
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from "primeng/table";
import { PaginatorModule } from "primeng/paginator";
import { RoleLink } from '../role-link/role-link';
import { AddNewRole } from '../add-new-role/add-new-role';
import { Button } from "primeng/button";
import { Toast } from 'primeng/toast';
import { AxiosResponse } from 'axios';

interface UserRoleResponse {
  status: boolean;
  message: string;
  data: any;
  httpStatus: string;
  roles: Array<{ id: number; roleName: string; roleDescription: string; status: boolean }>;
  total: number;
}

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [ReactiveFormsModule, Loader, BreadcrumbModule, TableModule, PaginatorModule, Button, Toast],
  templateUrl: './role.html',
  styleUrl: './role.scss',
  providers: [MessageService, DialogService],
})
export class Role implements OnInit, OnDestroy {

  isLoading: boolean = true;
  items: MenuItem[] | undefined;
  home: MenuItem | undefined;
  userRoleList: any = [];
  showAdvanceFilter: boolean = false;
  rowsPerPage: number[] = [10, 25, 50];
  criteriaList: any = [];
  searchForm: any = new FormGroup({
    criteria: new FormControl(this.criteriaList),
    first: new FormControl(0),
    page: new FormControl(0),
    size: new FormControl(10)
  });
  criteriaForm: any = new FormGroup({
    name: new FormControl(''),
    description: new FormControl('')
  });
  total: number = 0;

  availableFieldNames: any = [
    { fieldName: 'name', label: 'User Role Name', operator: 'LIKE' },
    { fieldName: 'description', label: 'User Role Description', operator: 'LIKE' },
  ];

  operators: any = ['EQUAL', 'LIKE', 'LTE', 'GTE'];

  currentPage: number = 0; // current page for pagination
  pageSize: number = 10; // page size for pagination
  totalRecords: number = 0; // total records for pagination

  constructor(private apiService: ApiService, public lookupService: LookupService, public dialogService: DialogService, private cdr: ChangeDetectorRef) { }

  ref: DynamicDialogRef | undefined;

  showHideAdvanceFilter() {
    this.showAdvanceFilter = !this.showAdvanceFilter;
    this.criteriaForm.patchValue({
      name: '',
      description: ''
    })
  }

  pageChange(event: any) {
    this.isLoading = true;
    // Update the form with correct pagination values
    this.searchForm.patchValue({
      first: event.first, // Update first value for the correct set of rows
      page: event.page,   // Update the page
      size: event.rows,   // Update page size
    });
    this.fetchUserRoleList(this.searchForm.value); // Re-fetch roles
  }

  submitSearchForm = () => {
    this.isLoading = true;
    this.searchForm.patchValue({
      page: 0,
      first: 0
    });

    const _tempCriteria: any = [];

    // Dynamically select the correct field name based on form input
    this.availableFieldNames.forEach((field: any) => {
      // Dynamically pick the fieldName from availableFieldNames, and not hardcoded
      if (this.criteriaForm.value[field.fieldName] !== '') {
        _tempCriteria.push({
          "fieldName": field.fieldName === 'name' ? "ROLE_NAME" : "ROLE_DESCRIPTION", // Set dynamically
          "operator": field.operator,
          "value": this.criteriaForm.value[field.fieldName]
        });
      }
    });

    this.criteriaList = _tempCriteria;
    const payload = {
      criteria: this.criteriaList,
      page: this.searchForm.value.page,
      size: this.searchForm.value.size
    };
    this.fetchUserRoleList(payload);
  }

  fetchUserRoleList = (payload: any) => {
    const customPayload = {
      criteria: payload.criteria,
      page: payload.page,
      size: payload.size
    };

    this.isLoading = true;

    this.apiService.POST('api/roles/searchRole', customPayload, 'alt')
      .then((res: AxiosResponse<UserRoleResponse>) => {
        if (res.status === 200) {
          this.userRoleList = Array.isArray(res.data.roles) ? res.data.roles : [];
          this.total = res.data.total || 0;
          this.totalRecords = this.total; // Ensure total records are set for paginator
          this.currentPage = payload.page;  // Update current page on successful response
        } else {
          this.userRoleList = [];
        }
      })
      .catch(err => {
        console.error('Error fetching roles:', err);
        this.userRoleList = [];
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  ngOnInit(): void {
    this.items = [{ icon: 'fas fa-users-rays me-2', label: 'Role List' }];
    this.home = { icon: 'fas fa-home me-2', routerLink: '/user-management/users' };
    this.fetchUserRoleList(this.searchForm.value);
  }

  manageRoleModal(roleDetails: any) {
    this.ref = this.dialogService.open(AddNewRole, {
      data: roleDetails,
      width: '70%',
      position: 'middle',
      contentStyle: { background: 'transparent', border: 'none', overflow: 'auto' },
      style: { 'background-color': 'transparent', 'box-shadow': 'none' },
      showHeader: false,
    });

    this.ref.onClose.subscribe((added: boolean) => {
      if (added) {
        this.fetchUserRoleList(this.searchForm.value);
      }
    });
  }

  linkRoleModal() {
    this.ref = this.dialogService.open(RoleLink, {
      width: '50%',
      contentStyle: { background: 'transparent', border: 'none', overflow: 'auto' },
      showHeader: false,
    });
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }

  resetForm() {
    // Step 1: Clear the criteria form
    this.criteriaForm.reset({
      name: '',
      description: ''
    });

    // Step 2: Reset searchForm (page and criteria should be reset as well)
    this.searchForm.patchValue({
      criteria: [],
      first: 0,
      page: 0,
      size: 10
    });

    // Step 3: Re-fetch the user role list with the reset search form values
    this.fetchUserRoleList(this.searchForm.value);
  }
}