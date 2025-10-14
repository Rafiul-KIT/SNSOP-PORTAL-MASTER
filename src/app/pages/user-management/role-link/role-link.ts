import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {ApiService} from '../../../../services/api.service';
import {DynamicDialogRef} from 'primeng/dynamicdialog';
import {MessageService} from 'primeng/api';
import {Loader} from '../../../components/loader/loader';
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-role-link',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Loader,
    CommonModule
  ],
  templateUrl: './role-link.html',
  styleUrls: ['./role-link.scss']
})
export class RoleLink  implements OnInit {

  isLoading: boolean = true;
  roleList: any = [];
  userList: any = [];

  roleLinkForm: any = new FormGroup({
    roleId: new FormControl(''),
    userId: new FormControl(''),
    userName: new FormControl('')
  });

  constructor(private apiService: ApiService, public ref: DynamicDialogRef, private messageService: MessageService) { }

  fetchRoleList = async () => {
    this.isLoading = true;
    try {
      const res = await this.apiService.POST('api/role/searchRole', { size: 100 }, 'alt');
      if (res.status === 200) {
        this.roleList = res.data?.roles ?? [];
        await this.fetchUserList();
      } else {
        this.roleList = [];
        this.isLoading = false;
      }
    } catch (err) {
      console.error(err);
      this.roleList = [];
      this.isLoading = false;
    }
  };

  fetchUserList = async () => {
    try {
      const res = await this.apiService.POST(
        'api/user/search',
        {
          size: 100,
          criteria: [{ fieldName: 'STATUS', operator: 'EQUAL', value: '0' }],
        },
        'alt'
      );
      if (res.status === 200) {
        this.userList = res.data?.users ?? [];
      } else {
        this.userList = [];
      }
    } catch (err) {
      console.error(err);
      this.userList = [];
    } finally {
      this.isLoading = false;
    }
  };


  getRoleDetail = (roleId: string) => {
    this.roleLinkForm.patchValue({
      roleId: roleId,
    })
  }

  getUserDetail = (user: string) => {
    const userInfo = user.split('-');
    this.roleLinkForm.patchValue({
      userId: userInfo[0],
      userName: userInfo[1]
    })
  }

  roleLinkFormHandler = () => {
    this.isLoading = true;
    // console.log(this.roleLinkForm.value);
    this.apiService
      .POST('api/role/linkUserRole', this.roleLinkForm.value)
      .then((res) => {
        // console.log('linkUserRole -----------> ', res);
        if (res.status === 200) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Role Linked with User Successfully.', life: 2000 });
          this.isLoading = false;
          this.ref.close(true);
        }
      })
      .catch((err) => {
        console.log(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.response.data.errors[0], life: 2000 });
        this.isLoading = false;
      });
  }

  ngOnInit(): void {
    this.fetchRoleList();
  }


}
