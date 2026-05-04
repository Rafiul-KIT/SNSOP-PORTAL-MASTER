import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import Swal from 'sweetalert2';
import { Loader } from '../../../components/loader/loader';
import { ITCategory, ITLookupPayload, ITModule, ITSubmodule, ITSubmodulePayload, ItSupportService } from '../../../../services/it-support.service';

type LookupKind = 'category' | 'module' | 'submodule';
type DialogMode = 'add' | 'edit';

type LookupItem = {
  id: number;
  parentModuleId?: number;
  name: string;
  description: string;
};

@Component({
  selector: 'app-help-desk-setup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule,
    Loader,
  ],
  templateUrl: './help-desk-setup.html',
  styleUrls: ['./help-desk-setup.scss'],
})
export class HelpDeskSetup implements OnInit {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Help Desk' }, { label: 'Categories & Modules' }];

  isLoading = false;
  isSaving = false;
  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  activeKind: LookupKind = 'category';
  editingItem: LookupItem | null = null;

  categorySearch = '';
  moduleSearch = '';
  submoduleSearch = '';
  categories: LookupItem[] = [];
  modules: LookupItem[] = [];
  submodules: LookupItem[] = [];

  lookupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private itSupportService: ItSupportService,
    private cdr: ChangeDetectorRef
  ) {
    this.lookupForm = this.fb.group({
      parentModuleId: [null],
      name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.loadLookups();
  }

  get dialogTitle(): string {
    const itemLabel = this.getKindLabel(this.activeKind);
    return `${this.dialogMode === 'add' ? 'Add' : 'Edit'} ${itemLabel}`;
  }

  get activeName(): string {
    return this.activeKind;
  }

  get categoryCountLabel(): string {
    return `${this.categories.length} ${this.categories.length === 1 ? 'category' : 'categories'}`;
  }

  get moduleCountLabel(): string {
    return `${this.modules.length} ${this.modules.length === 1 ? 'module' : 'modules'}`;
  }

  get submoduleCountLabel(): string {
    return `${this.submodules.length} ${this.submodules.length === 1 ? 'submodule' : 'submodules'}`;
  }

  get moduleOptions(): Array<{ label: string; value: number }> {
    return this.modules.map((module) => ({ label: module.name, value: module.id }));
  }

  private detectChanges(): void {
    this.cdr.detectChanges();
  }

  private normalizeItems(items: Array<ITCategory | ITModule>): LookupItem[] {
    return items.map((item) => ({
      id: Number(item.id),
      name: item.name || '',
      description: item.description || '',
    }));
  }

  private normalizeSubmodules(items: ITSubmodule[]): LookupItem[] {
    return items.map((item) => ({
      id: Number(item.id),
      parentModuleId: Number(item.parentModuleId),
      name: item.name || '',
      description: item.description || '',
    }));
  }

  async loadLookups(): Promise<void> {
    this.isLoading = true;
    this.detectChanges();

    try {
      const [categories, modules, submodules] = await Promise.all([
        this.itSupportService.getCategories(),
        this.itSupportService.getModules(),
        this.itSupportService.getSubmodules(),
      ]);

      this.categories = this.normalizeItems(categories);
      this.modules = this.normalizeItems(modules);
      this.submodules = this.normalizeSubmodules(submodules);
    } catch {
      this.categories = [];
      this.modules = [];
      this.submodules = [];
      await Swal.fire({
        icon: 'error',
        title: 'Setup Data Failed',
        text: 'Unable to load help desk categories, modules and submodules.',
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isLoading = false;
      this.detectChanges();
    }
  }

  filteredItems(kind: LookupKind): LookupItem[] {
    const search = this.getSearchValue(kind).trim().toLowerCase();
    const items = this.getItems(kind);

    if (!search) return items;

    return items.filter((item) =>
      `${item.name} ${this.getParentModuleName(item.parentModuleId)} ${item.description}`.toLowerCase().includes(search)
    );
  }

  getParentModuleName(parentModuleId?: number | null): string {
    if (!parentModuleId) return '--';
    return this.modules.find((module) => Number(module.id) === Number(parentModuleId))?.name || '--';
  }

  isOtherCategory(item?: LookupItem | null): boolean {
    return String(item?.name || '').trim().toLowerCase() === 'other';
  }

  openAddDialog(kind: LookupKind): void {
    this.activeKind = kind;
    this.dialogMode = 'add';
    this.editingItem = null;
    this.syncParentModuleValidator(kind);
    this.lookupForm.reset({ parentModuleId: null, name: '', description: '' });
    this.dialogVisible = true;
  }

  openEditDialog(kind: LookupKind, item: LookupItem): void {
    if (kind === 'category' && this.isOtherCategory(item)) return;

    this.activeKind = kind;
    this.dialogMode = 'edit';
    this.editingItem = item;
    this.syncParentModuleValidator(kind);
    this.lookupForm.reset({
      parentModuleId: item.parentModuleId ?? null,
      name: item.name,
      description: item.description,
    });
    this.dialogVisible = true;
  }

  closeDialog(): void {
    if (this.isSaving) return;

    this.dialogVisible = false;
    this.lookupForm.reset({ parentModuleId: null, name: '', description: '' });
    this.editingItem = null;
  }

  async saveLookup(): Promise<void> {
    if (this.lookupForm.invalid) {
      this.lookupForm.markAllAsTouched();
      return;
    }

    const formValue = this.lookupForm.value;
    const payload: ITLookupPayload | ITSubmodulePayload = {
      ...(this.activeKind === 'submodule' ? { parentModuleId: Number(formValue.parentModuleId) } : {}),
      name: String(formValue.name || '').trim(),
      description: String(formValue.description || '').trim(),
    };

    if (!payload.name || !payload.description || (this.activeKind === 'submodule' && !Number((payload as ITSubmodulePayload).parentModuleId))) {
      this.lookupForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.detectChanges();

    try {
      const result = await this.persistLookup(payload);

      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: `${this.getKindLabel(this.activeKind)} Saved`,
          text: result.message || `${this.dialogTitle} completed successfully.`,
          confirmButtonColor: '#14532d',
          timer: 1400,
          showConfirmButton: false,
        });
        this.dialogVisible = false;
        this.editingItem = null;
        await this.loadLookups();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text: result.message || `Unable to save ${this.activeName}.`,
          confirmButtonColor: '#d33',
        });
      }
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Unexpected Error',
        text: `Unable to save ${this.activeName}.`,
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isSaving = false;
      this.detectChanges();
    }
  }

  private persistLookup(payload: ITLookupPayload | ITSubmodulePayload): Promise<{ success: boolean; message?: string }> {
    if (this.activeKind === 'category') {
      if (this.dialogMode === 'edit' && this.editingItem) {
        return this.itSupportService.updateCategory(this.editingItem.id, payload as ITLookupPayload);
      }

      return this.itSupportService.createCategory(payload as ITLookupPayload);
    }

    if (this.activeKind === 'submodule') {
      if (this.dialogMode === 'edit' && this.editingItem) {
        return this.itSupportService.updateSubmodule(this.editingItem.id, payload as ITSubmodulePayload);
      }

      return this.itSupportService.createSubmodule(payload as ITSubmodulePayload);
    }

    if (this.dialogMode === 'edit' && this.editingItem) {
      return this.itSupportService.updateModule(this.editingItem.id, payload as ITLookupPayload);
    }

    return this.itSupportService.createModule(payload as ITLookupPayload);
  }

  private syncParentModuleValidator(kind: LookupKind): void {
    const control = this.lookupForm.get('parentModuleId');
    if (!control) return;

    if (kind === 'submodule') {
      control.setValidators([Validators.required]);
    } else {
      control.clearValidators();
      control.setValue(null, { emitEvent: false });
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  private getItems(kind: LookupKind): LookupItem[] {
    if (kind === 'category') return this.categories;
    if (kind === 'submodule') return this.submodules;
    return this.modules;
  }

  private getSearchValue(kind: LookupKind): string {
    if (kind === 'category') return this.categorySearch;
    if (kind === 'submodule') return this.submoduleSearch;
    return this.moduleSearch;
  }

  private getKindLabel(kind: LookupKind): string {
    if (kind === 'category') return 'Category';
    if (kind === 'submodule') return 'Submodule';
    return 'Module';
  }
}
