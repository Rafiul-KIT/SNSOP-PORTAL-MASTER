import { Component, OnInit } from '@angular/core';
import { Loader } from '../../components/loader/loader';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { MessageService } from 'primeng/api';

import { jwtDecode } from 'jwt-decode';
import { ApiService } from '../../../services/api.service';
import { AzureAdAuthService } from '../../../services/azure-ad-auth.service';

interface RoleInfo {
  id: number;
  name: string;
  description?: string;
  status?: boolean;
  createdBy?: number;
  createdAt?: string;
  modifiedBy?: number;
  modifiedAt?: string;
  version?: number;
}

@Component({
  selector: 'app-profile',
    standalone: true,
  imports: [Loader, ButtonModule, CardModule, RouterModule, ReactiveFormsModule, BreadcrumbModule, Loader],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  providers: [MessageService]
})
export class Profile implements OnInit {
  isLoading = false;
  private routeUserId: number | null = null;
  private initialFormValue: any = {};
  isFormUnchanged = true;
  user: any = {}; // Declare user property
  userInfo: any = null;

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'User List', routerLink: ['/user-management/users'], icon: 'fas fa-users' },
    { label: 'Register New User', icon: 'fas fa-user-plus' },
  ];

  userRegistrationForm!: FormGroup;
  userDetails: { status: 'ACTIVE' | 'INACTIVE' | 'PENDING' } | null = null;

  /*roles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Manager' },
    { id: 3, name: 'User' },
  ];*/
  roles: RoleInfo[] = [];

  statusOptions = [
    { value: 1, label: 'ACTIVE' },
    { value: 0, label: 'INACTIVE' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService,
    private azureService: AzureAdAuthService,
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.initialFormValue = this.userRegistrationForm.value;
    this.userRegistrationForm.valueChanges.subscribe(value => {
      this.isFormUnchanged = this.areObjectsEqual(this.initialFormValue, value);
    });

    this.loadRoles();

    this.userInfo = this.azureService.loginState()?.user;
    this.loadUserDetails(this.userInfo.sub);

    const idParam = this.activatedRoute.snapshot.queryParamMap.get('id');
    this.routeUserId = idParam !== null ? Number(idParam) : null;

    if (this.routeUserId !== null && !Number.isNaN(this.routeUserId)) {
      this.loadUserDetails(this.routeUserId);
    }

    this.updatePasswordValidators(this.userRegistrationForm.value.isMobile);
    this.ctrl('isMobile')!.valueChanges.subscribe((val: boolean) =>
      this.updatePasswordValidators(val)
    );
  }


  private statusToNumber(s: string | null | undefined): 0 | 1 {
    const v = (s ?? '').toString().trim().toUpperCase();
    return v === 'ACTIVE' ? 1 : 0;
  }


  private normalizeStatus(s: string | null | undefined): 'ACTIVE' | 'INACTIVE' | 'PENDING' {
    const v = (s ?? '').toString().trim().toUpperCase();
    if (v === 'ACTIVE' || v === 'INACTIVE' || v === 'PENDING') return v as any;
    // map common variants
    if (v === 'ACTIVE') return 'ACTIVE';
    if (v === 'INACTIVE') return 'INACTIVE';
    return 'PENDING';
  }


  async loadRoles(): Promise<void> {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const res = await this.api.GET('/api/users/roles', {}, 'alt');

      // The endpoint returns a plain array → no "data" wrapper
      this.roles = (Array.isArray(res.data) ? res.data : [])
        .filter((r: RoleInfo) => r.status === true) // optional filter
        .map((r: RoleInfo) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          status: r.status,
        }));

    } catch (err: any) {
      console.error('Failed to load roles', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load roles from server.'
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }


  async loadUserDetails(userId: number): Promise<void> {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      // query-param version: /api/users/findOne?id=123
      const res = await this.api.GET('/api/users/findOne', { id: userId }, 'alt');

      if (res?.data) {
        const user = res.data as {
          id: number;
          fullName: string;
          email: string;
          role?: string;       // e.g., "IpApprover"
          status?: string;     // e.g., "Active"
          emailReceiver?: boolean;
          isMobile?: boolean;
          username?: string;
          roleId?: number;     // backend might or might not send this
        };

        this.user = user;
        let mappedRoleId: number | null = null;
        if (typeof user.roleId === 'number') {
          mappedRoleId = user.roleId;
        } else if (user.role) {
          const byName = this.roles.find(
            r => r.name?.trim().toLowerCase() === user.role!.trim().toLowerCase()
          );
          mappedRoleId = byName ? byName.id : null;
        }

        const formValue = {
          username: user.username ?? (user.email ? user.email.split('@')[0] : ''),
          fullName: user.fullName ?? '',
          email: user.email ?? '',
          roleId: mappedRoleId,
          status: this.statusToNumber(user.status),
          isMobile: !!user.isMobile,
          emailReceiver: !!user.emailReceiver,
          password: '',
        };
        this.initialFormValue = formValue;
        this.userRegistrationForm.reset(formValue, { emitEvent: false });
        this.isFormUnchanged = true;

        // set footer status info
        this.userDetails = {
          status: this.normalizeStatus(user.status),
        };
      }
    } catch (err: any) {
      console.error('Failed to load user details', err);
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Unable to load user details from server.' });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }



  private buildForm(): void {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    this.userRegistrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.pattern(emailPattern)]],
      // password validators will be set dynamically based on isMobile
      password: [''],
      isMobile: [false],
      emailReceiver: [false],
      status: [1, [Validators.required]], // 1 = ACTIVE, 0 = INACTIVE
      roleId: [null, [Validators.required]],
    });
  }

  private updatePasswordValidators(isMobile: boolean) {
    const pwd = this.ctrl('password');
    if (!pwd) return;

    if (isMobile) {
      pwd.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(100)]);
    } else {
      pwd.clearValidators();
    }
    pwd.updateValueAndValidity({ emitEvent: false });
  }

  // ---------- Template helpers ----------
  ctrl(name: string): AbstractControl | null {
    return this.userRegistrationForm.get(name);
  }
  val(name: string): any {
    return this.ctrl(name)?.value;
  }
  has(name: string, error: string): boolean {
    const c = this.ctrl(name);
    return !!c && c.hasError(error) && (c.dirty || c.touched);
  }
  nonEmpty(name: string): boolean {
    const v = this.val(name);
    return v !== null && v !== undefined && String(v).trim() !== '';
  }

  // ---------- Actions ----------
  async formHandler(mode: 1 | 2 | null): Promise<void> {
    if (this.userRegistrationForm.invalid) {
      this.userRegistrationForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const token = this.api['cookies'].get(this.api.ACCESS_TOKEN);
      let currentUserId: number | null = null;
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          currentUserId = decoded?.sub ? Number(decoded.sub) : null;
        } catch (e) {
          console.warn('Failed to decode token:', e);
        }
      }

      const specialHeaders = {
        headers: {
          'X-Current-User': currentUserId ?? 0,
          'X-ENV': 'dev',
        },
      };

      // ✅ use parsed query id to decide insert vs update
      const isInsert = this.routeUserId === null;

      const res = await this.api.POST(
        `/api/users/new?isInsert=${isInsert}`,
        payload,
        'alt',
        specialHeaders
      );

      const apiStatus = String(res.data?.status || '').toUpperCase();
      const apiMessage = res.data?.message || 'No message returned';

      if (apiStatus.includes('201') || apiStatus === 'OK' || apiStatus === 'CREATED') {
        this.msg.add({ severity: 'success', summary: 'Success', detail: apiMessage || 'User saved.' });

        if (mode === 1) {
          setTimeout(() => this.router.navigate(['/user-management/users']), 500);
        } else if (mode === 2) {
          this.resetForm();
        }
      } else {
        this.msg.add({ severity: 'warn', summary: 'Warning', detail: apiMessage || `Request failed: ${apiStatus}` });
      }
    } catch (err: any) {
      console.error('Registration failed', err);
      const status = err?.response?.status || 'N/A';
      const message = err?.response?.data?.message || err.message || 'Unexpected error occurred';
      this.msg.add({ severity: 'error', summary: 'Error', detail: `Failed: ${status} - ${message}`, life: 7000 });
    } finally {
      this.isLoading = false;
      const idParam = this.activatedRoute.snapshot.queryParamMap.get('id');
      this.routeUserId = idParam !== null ? Number(idParam) : null;

      if (this.routeUserId !== null && !Number.isNaN(this.routeUserId)) {
        this.loadUserDetails(this.routeUserId);
      }
      this.cdr.detectChanges();
    }
  }



  private resetForm(): void {
    const emptyFormValue = {
      username: '',
      fullName: '',
      email: '',
      password: '',
      isMobile: false,
      emailReceiver: false,
      status: 1,
      roleId: null,
    };
    this.initialFormValue = emptyFormValue;
    this.userRegistrationForm.reset(emptyFormValue, { emitEvent: false });
    this.isFormUnchanged = true;
  }

  private buildPayload() {
    const v = this.userRegistrationForm.value;
    return {
      roleId: Number(v.roleId),
      fullName: v.fullName,
      email: v.email,
      status: Number(v.status),
      emailReceiver: !!v.emailReceiver,
      username: v.username,
      password: v.password || null,
      isMobile: !!v.isMobile,
    };
  }

  private areObjectsEqual(obj1: any, obj2: any): boolean {
    if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) {
      return obj1 === obj2;
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }

    return true;
  }

    editUser(userInfo: any) {
    this.router.navigate(['/user-management/register'], {
      queryParams: { id: userInfo.sub },
    });
  }
}