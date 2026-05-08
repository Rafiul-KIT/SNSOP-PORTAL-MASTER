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
  menuTree: any[] = [];
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
        Validators.minLength(2),
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

  processMenus(menus: any[], assignedMenuIds: Set<number> = new Set()) {
    const menuMap = new Map<number, any>();
    const roots: any[] = [];

    menus.forEach(menu => {
      menuMap.set(menu.id, {
        ...menu,
        label: menu.label || menu.name,
        checked: assignedMenuIds.has(menu.id),
        children: []
      });
    });

    menuMap.forEach(menu => {
      if (menu.parentMenu && menuMap.has(menu.parentMenu.id)) {
        const parent = menuMap.get(menu.parentMenu.id);
        if (parent) {
          parent.children.push(menu);
          menu.parentNode = parent; // Store parent reference for bubbling up
        }
      } else {
        roots.push(menu);
      }
    });

    // Recursively ensure parents are checked if any descendant is checked
    const syncParentStatus = (node: any) => {
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => syncParentStatus(child));
        if (node.children.some((c: any) => c.checked)) {
          node.checked = true;
        }
      }
    };
    roots.forEach(root => syncParentStatus(root));

    this.menuTree = roots;
  }

  async fetchRoleMenus(roleId: number) {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      // 1️⃣ Fetch menus assigned to this role
      const res = await this.apiService.GET(`api/menus/role/${roleId}`, {}, 'alt');
      const assignedMenus = res?.data?.data || [];

      // 2️⃣ Create quick lookup set for assigned menu IDs
      const assignedSet = new Set<number>(assignedMenus.map((m: any) => m.id));

      // 3️⃣ Load all available menus (with real IDs)
      const lookupMenus = await this.lookupService.getMenuList() || [];

      // 4️⃣ Process menus into a tree structure
      this.processMenus(lookupMenus, assignedSet);

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

  onMenuChange(menu: any) {
    // 1. Cascade down: if parent is checked/unchecked, all descendants follow
    const toggleChildren = (node: any, val: boolean) => {
      if (node.children) {
        node.children.forEach((c: any) => {
          c.checked = val;
          toggleChildren(c, val);
        });
      }
    };
    toggleChildren(menu, menu.checked);

    // 2. Bubble up: if a child is checked, all ancestors must be checked
    if (menu.checked) {
      let current = menu.parentNode;
      while (current) {
        current.checked = true;
        current = current.parentNode;
      }
    }
    this.cdr.detectChanges();
  }

  /** ✅ Create or update role */
  formHandler = async (type: 1 | 2 | null) => {
    this.isLoading = true;

    // 🔹 Collect checked menus
    const selectedMenus: any[] = [];
    const collectChecked = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.checked) {
          selectedMenus.push(node);
        }
        if (node.children && node.children.length > 0) {
          collectChecked(node.children);
        }
      });
    };
    collectChecked(this.menuTree);


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
      this.isLoading = true;
      this.lookupService.getMenuList().then((menus) => {
        this.processMenus(menus || []);
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }
}
