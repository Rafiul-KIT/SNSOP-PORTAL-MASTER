import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import Swal from 'sweetalert2';
import { Loader } from '../../../components/loader/loader';
import { ITCategory, ITLookupPayload, ITModule, ItSupportService } from '../../../../services/it-support.service';

type LookupKind = 'category' | 'module';
type DialogMode = 'add' | 'edit';

type LookupItem = {
  id: number;
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
  categories: LookupItem[] = [];
  modules: LookupItem[] = [];

  lookupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private itSupportService: ItSupportService,
    private cdr: ChangeDetectorRef
  ) {
    this.lookupForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.loadLookups();
  }

  get dialogTitle(): string {
    const itemLabel = this.activeKind === 'category' ? 'Category' : 'Module';
    return `${this.dialogMode === 'add' ? 'Add' : 'Edit'} ${itemLabel}`;
  }

  get activeName(): string {
    return this.activeKind === 'category' ? 'category' : 'module';
  }

  get categoryCountLabel(): string {
    return `${this.categories.length} ${this.categories.length === 1 ? 'category' : 'categories'}`;
  }

  get moduleCountLabel(): string {
    return `${this.modules.length} ${this.modules.length === 1 ? 'module' : 'modules'}`;
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

  async loadLookups(): Promise<void> {
    this.isLoading = true;
    this.detectChanges();

    try {
      const [categories, modules] = await Promise.all([
        this.itSupportService.getCategories(),
        this.itSupportService.getModules(),
      ]);

      this.categories = this.normalizeItems(categories);
      this.modules = this.normalizeItems(modules);
    } catch {
      this.categories = [];
      this.modules = [];
      await Swal.fire({
        icon: 'error',
        title: 'Setup Data Failed',
        text: 'Unable to load help desk categories and modules.',
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isLoading = false;
      this.detectChanges();
    }
  }

  filteredItems(kind: LookupKind): LookupItem[] {
    const search = (kind === 'category' ? this.categorySearch : this.moduleSearch).trim().toLowerCase();
    const items = kind === 'category' ? this.categories : this.modules;

    if (!search) return items;

    return items.filter((item) =>
      `${item.name} ${item.description}`.toLowerCase().includes(search)
    );
  }

  openAddDialog(kind: LookupKind): void {
    this.activeKind = kind;
    this.dialogMode = 'add';
    this.editingItem = null;
    this.lookupForm.reset({ name: '', description: '' });
    this.dialogVisible = true;
  }

  openEditDialog(kind: LookupKind, item: LookupItem): void {
    this.activeKind = kind;
    this.dialogMode = 'edit';
    this.editingItem = item;
    this.lookupForm.reset({
      name: item.name,
      description: item.description,
    });
    this.dialogVisible = true;
  }

  closeDialog(): void {
    if (this.isSaving) return;

    this.dialogVisible = false;
    this.lookupForm.reset({ name: '', description: '' });
    this.editingItem = null;
  }

  async saveLookup(): Promise<void> {
    if (this.lookupForm.invalid) {
      this.lookupForm.markAllAsTouched();
      return;
    }

    const formValue = this.lookupForm.value;
    const payload: ITLookupPayload = {
      name: String(formValue.name || '').trim(),
      description: String(formValue.description || '').trim(),
    };

    if (!payload.name || !payload.description) {
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
          title: `${this.activeKind === 'category' ? 'Category' : 'Module'} Saved`,
          text: result.message || `${this.dialogTitle} completed successfully.`,
          confirmButtonColor: '#3085d6',
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

  private persistLookup(payload: ITLookupPayload): Promise<{ success: boolean; message?: string }> {
    if (this.activeKind === 'category') {
      if (this.dialogMode === 'edit' && this.editingItem) {
        return this.itSupportService.updateCategory(this.editingItem.id, payload);
      }

      return this.itSupportService.createCategory(payload);
    }

    if (this.dialogMode === 'edit' && this.editingItem) {
      return this.itSupportService.updateModule(this.editingItem.id, payload);
    }

    return this.itSupportService.createModule(payload);
  }
}
