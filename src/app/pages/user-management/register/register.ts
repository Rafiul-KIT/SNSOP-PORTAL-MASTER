import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

import { ApiService } from '../../../../services/api.service';
import { Loader } from '../../../components/loader/loader';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { jwtDecode } from 'jwt-decode';

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
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
  imports: [RouterModule, ReactiveFormsModule, BreadcrumbModule, Loader, ToastModule],
  providers: [MessageService]
})

export class Register implements OnInit {
  isLoading = false;

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'User List', routerLink: ['/pages/user-management/users'], icon: 'fas fa-users' },
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
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadRoles();

    const userId = this.activatedRoute.snapshot.queryParamMap.get('id');

    if (userId) {
      this.loadUserDetails(userId); // If an ID is present, load user details
    }
    // set initial password validators depending on initial isMobile value
    this.updatePasswordValidators(this.userRegistrationForm.value.isMobile);
    // react to changes of isMobile
    this.ctrl('isMobile')!.valueChanges.subscribe((val: boolean) =>
      this.updatePasswordValidators(val)
    );
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


  async loadUserDetails(userId: string): Promise<void> {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      // Call API to get user details by ID
      const res = await this.api.GET(`/api/users/findOne/${userId}`, {}, 'alt');

      if (res.data) {
        const user = res.data;
        // Populate the form with the retrieved user details
        this.userRegistrationForm.patchValue({
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          roleId: user.roleId,
          status: user.status === 'ACTIVE' ? 1 : 0,
          isMobile: user.isMobile,
          emailReceiver: user.emailReceiver,
        });
      }

    } catch (err: any) {
      console.error('Failed to load user details', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load user details from server.'
      });
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
      // 🔐 Decode token to get current user ID
      const token = this.api['cookies'].get(this.api.ACCESS_TOKEN);
      let currentUserId: number | null = null;

      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          currentUserId = decoded?.sub ? Number(decoded.sub) : null; // 👈 'sub' = user id
        } catch (e) {
          console.warn('Failed to decode token:', e);
        }
      }

      // 🧾 Add custom headers for this request only
      const specialHeaders = {
        headers: {
          'X-Current-User': currentUserId ?? 0,
          'X-ENV': 'dev',
        },
      };

      // 🚀 Make API call
      const res = await this.api.POST('/api/users/new', payload, 'alt', specialHeaders);

      // ✅ Extract backend response fields
      const apiStatus = String(res.data?.status || '').toUpperCase();
      const apiMessage = res.data?.message || 'No message returned';

      // ✅ Success condition (201 CREATED or OK)
      if (apiStatus.includes('201') || apiStatus === 'OK' || apiStatus === 'CREATED') {
        this.msg.add({
          severity: 'success',
          summary: 'Success',
          detail: apiMessage || 'User created successfully.'
        });

        if (mode === 1) {
          setTimeout(() => this.router.navigate(['/users']), 500);
        } else if (mode === 2) {
          this.resetForm();
        }
      }
      // ⚠️ Any other status from backend
      else {
        this.msg.add({
          severity: 'warn',
          summary: 'Warning',
          detail: apiMessage || `Request failed with status: ${apiStatus}`
        });
      }

    } catch (err: any) {
      console.error('Registration failed', err);

      // 🧩 Handle network or server error
      const status = err?.response?.status || 'N/A';
      const message = err?.response?.data?.message || err.message || 'Unexpected error occurred';

      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed: ${status} - ${message}`,
        life: 7000
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }



  private resetForm(): void {
    this.userRegistrationForm.reset({
      username: '',
      fullName: '',
      email: '',
      password: '',
      isMobile: false,
      emailReceiver: false,
      status: 1,
      roleId: null,
    });
  }

  private buildPayload() {
    const v = this.userRegistrationForm.value;
    // match swagger DTO fields (without mobile)
    return {
      roleId: Number(v.roleId),
      fullName: v.fullName,
      email: v.email,
      status: Number(v.status),
      emailReceiver: !!v.emailReceiver,
      username: v.username,
      password: v.password || null, // optional when isMobile=false
      isMobile: !!v.isMobile,
    };
  }
}
