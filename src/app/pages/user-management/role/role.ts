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

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [ReactiveFormsModule, Loader, BreadcrumbModule, TableModule, PaginatorModule],
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
      first: event.first,
      page: event.page,
      size: event.rows,
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
    // console.log(this.criteriaForm.value);
    this.availableFieldNames.forEach((field: any) => {
      if (this.criteriaForm.value[field.fieldName] != '') {
        _tempCriteria.push({
          "fieldName": field.fieldName,
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
    }
    this.fetchUserRoleList(payload);
    // console.log(_tempCriteria);
  }
  fetchUserRoleList = (payload: any) => {
    const customPayload = {
      criteria: payload.criteria,
      page: payload.page,
      size: payload.size
    };

    this.isLoading = true;

    this.apiService.GET('api/users/roles', customPayload, 'alt')
      .then(res => {
        if (res.status === 200) {
          // ✅ Directly assign array response
          this.userRoleList = Array.isArray(res.data) ? res.data : [];

          // ✅ Optional: if total count is not returned, derive from length
          this.total = this.userRoleList.length;

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
    this.home = { label: 'Dashboard', icon: 'fas fa-home me-2', routerLink: '/home/portals' };
    this.fetchUserRoleList(this.searchForm.value);
  }

  manageRoleModal(roleDetails: any) {
    // this.ref = this.dialogService.open(RoleManageComponent, {
    //   data: roleDetails,
    //   header: 'Update Role',
    //   width: '70%',
    //   // position: 'bottom',
    //   contentStyle: { overflow: 'auto' },
    // });

    // this.ref.onClose.subscribe((added: boolean) => {
    //   if (added) {
    //     this.fetchUserRoleList(this.searchForm.value);
    //   }
    // });
  }

  linkRoleModal() {
    // this.ref = this.dialogService.open(LinkRoleComponent, {
    //   header: 'Link User Role',
    //   width: '50%',
    //   contentStyle: { overflow: 'auto' },
    // });
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }

}
