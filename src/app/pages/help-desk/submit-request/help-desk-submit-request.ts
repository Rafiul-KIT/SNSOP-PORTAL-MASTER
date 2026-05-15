import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import Swal from 'sweetalert2';
import { Loader } from '../../../components/loader/loader';
import { IT_SUPPORT_ISSUE_TYPE_OPTIONS, IT_SUPPORT_PRIORITY_OPTIONS, ITCategory, ITModule, ITSubmodule, ItSupportService } from '../../../../services/it-support.service';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-help-desk-submit-request',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, BreadcrumbModule, ButtonModule,
    SelectModule, InputTextModule, TextareaModule, FloatLabelModule,
    InputGroupModule, ProgressSpinnerModule, Loader
  ],
  templateUrl: './help-desk-submit-request.html',
  styleUrls: ['./help-desk-submit-request.scss']
})
export class HelpDeskSubmitRequest implements OnInit {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Helpdesk' }, { label: 'Submit Support Request' }];

  requestForm: FormGroup;
  selectedFiles: File[] = [];
  trackingNumber: string | null = null;
  isSubmitting = false;
  isLoading = false;

  categories: { label: string; value: number }[] = [];
  modules: { label: string; value: number }[] = [];
  submodules: Array<{ label: string; value: number; parentModuleId: number }> = [];

  priorities = IT_SUPPORT_PRIORITY_OPTIONS;

  issueTypes = IT_SUPPORT_ISSUE_TYPE_OPTIONS;

  constructor(
    private fb: FormBuilder,
    private itSupportService: ItSupportService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private router: Router,
    private apiService: ApiService
  ) {
    this.requestForm = this.fb.group({
      issueTitle: ['', Validators.required],
      issueType: [null],
      category: [null],
      otherCategory: [null],
      priority: [null, Validators.required],
      description: ['', Validators.required],
      module: [null, Validators.required],
      submodule: [{ value: null, disabled: true }],
      notification: ['EMAIL'],
      attachments: [null]
    });
  }

  get isAdmin(): boolean {
    const user = this.apiService.loginState()?.user;
    return Number(user?.roleId) === 1;
  }

  ngOnInit(): void {
    this.loadDropdowns();
    this.requestForm.get('category')?.valueChanges.subscribe(() => this.syncOtherCategoryValidator());
    this.requestForm.get('module')?.valueChanges.subscribe(() => this.onModuleChange());
  }

  private detectChanges(): void {
    this.cdr.detectChanges();
  }

  async navigateToSetup(): Promise<void> {
    await this.router.navigate(['/help-desk/setup']);
  }

  async loadDropdowns(): Promise<void> {
    this.isLoading = true;
    this.detectChanges();
    
    this.zone.runOutsideAngular(async () => {
      try {
        const [categoryData, moduleData, submoduleData] = await Promise.all([
          this.itSupportService.getCategories(),
          this.itSupportService.getModules(),
          this.itSupportService.getSubmodules()
        ]);

        this.zone.run(() => {
          this.categories = categoryData.map((cat: ITCategory) => ({
            label: cat.name,
            value: cat.id
          }));

          this.modules = moduleData.map((mod: ITModule) => ({
            label: mod.name,
            value: mod.id
          }));

          this.submodules = submoduleData.map((submodule: ITSubmodule) => ({
            label: submodule.name,
            value: submodule.id,
            parentModuleId: submodule.parentModuleId
          }));

          this.isLoading = false;
          this.syncOtherCategoryValidator();
          this.onModuleChange(false);
          this.detectChanges();
        });
      } catch (error) {
        console.error('Error loading dropdowns:', error);
        this.zone.run(() => {
          this.isLoading = false;
          this.detectChanges();
        });
      }
    });
  }

  private isOtherCategoryName(name?: string | null): boolean {
    return String(name || '').trim().toLowerCase() === 'other';
  }

  isOtherCategorySelected(): boolean {
    const selectedCategoryId = Number(this.requestForm.get('category')?.value);
    return this.categories.some((cat) => Number(cat.value) === selectedCategoryId && this.isOtherCategoryName(cat.label));
  }

  get filteredSubmodules(): Array<{ label: string; value: number; parentModuleId: number }> {
    const selectedModuleId = Number(this.requestForm.get('module')?.value);
    if (!selectedModuleId) return [];

    return this.submodules.filter((submodule) => Number(submodule.parentModuleId) === selectedModuleId);
  }

  private onModuleChange(resetSubmodule: boolean = true): void {
    const moduleControl = this.requestForm.get('module');
    const submoduleControl = this.requestForm.get('submodule');
    if (!submoduleControl || !moduleControl) return;

    if (resetSubmodule) {
      submoduleControl.setValue(null, { emitEvent: false });
    }

    if (moduleControl.value) {
      submoduleControl.enable({ emitEvent: false });
    } else {
      submoduleControl.disable({ emitEvent: false });
    }

    submoduleControl.updateValueAndValidity({ emitEvent: false });
    this.detectChanges();
  }

  private syncOtherCategoryValidator(): void {
    const otherCategoryControl = this.requestForm.get('otherCategory');
    if (!otherCategoryControl) return;

    otherCategoryControl.clearValidators();
    if (!this.isOtherCategorySelected()) {
      otherCategoryControl.setValue(null, { emitEvent: false });
    }

    otherCategoryControl.updateValueAndValidity({ emitEvent: false });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const incoming = input.files ? Array.from(input.files) : [];
    if (!incoming.length) return;

    // Keep already selected files and append new selections (avoid exact duplicates).
    const existingKeys = new Set(this.selectedFiles.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
    const uniqueIncoming = incoming.filter((f) => !existingKeys.has(`${f.name}-${f.size}-${f.lastModified}`));
    this.selectedFiles = [...this.selectedFiles, ...uniqueIncoming];

    // Update form control for validation
    this.requestForm.get('attachments')?.setValue(this.selectedFiles.length > 0 ? this.selectedFiles : null);
    this.requestForm.get('attachments')?.markAsTouched();

    // Clear file input so selecting the same file again still triggers change event.
    input.value = '';
    this.detectChanges();
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.selectedFiles = [...this.selectedFiles];
    
    // Update form control for validation
    this.requestForm.get('attachments')?.setValue(this.selectedFiles.length > 0 ? this.selectedFiles : null);
    this.requestForm.get('attachments')?.markAsTouched();
    
    this.detectChanges();
  }

  viewSelectedFile(file: File): void {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async copyTrackingNumber(): Promise<void> {
    if (!this.trackingNumber) return;

    try {
      await navigator.clipboard.writeText(this.trackingNumber);
      Swal.fire({
        icon: 'success',
        title: 'Copied',
        text: 'Tracking number copied to clipboard.',
        timer: 1200,
        showConfirmButton: false
      });
    } catch (error) {
      // Fallback for restricted clipboard environments.
      const textarea = document.createElement('textarea');
      textarea.value = this.trackingNumber;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      Swal.fire({
        icon: 'success',
        title: 'Copied',
        text: 'Tracking number copied to clipboard.',
        timer: 1200,
        showConfirmButton: false
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.requestForm.valid) {
      this.isSubmitting = true;
      this.detectChanges();
      
      const formValue = this.requestForm.value;
      const otherCategory = this.isOtherCategorySelected()
        ? String(formValue.otherCategory || '').trim()
        : null;
      const moduleId = Number(formValue.module);
      const submoduleId = Number(formValue.submodule);

      try {
        const result = await this.itSupportService.createRequest({
          title: formValue.issueTitle,
          description: formValue.description,
          issueType: formValue.issueType,
          categoryId: formValue.category,
          otherCategory,
          moduleId: Number.isFinite(moduleId) && moduleId > 0 ? moduleId : undefined,
          submoduleId: Number.isFinite(submoduleId) && submoduleId > 0 ? submoduleId : undefined,
          priority: formValue.priority,
          files: this.selectedFiles
        });

        if (result.success) {
          this.trackingNumber = result.trackingNumber || '';
          this.detectChanges();
          Swal.fire({
            icon: 'success',
            title: 'Submission Successful',
            html: `
              <p style="margin-bottom:8px;">Your tracking number is:</p>
              <strong>${this.trackingNumber}</strong>
              <p style="margin-top:10px;">Please save this number to track your request status.</p>
            `,
            confirmButtonColor: '#3085d6'
          });
          this.requestForm.reset();
          this.selectedFiles = [];
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: result.message || 'Failed to submit request. Please try again.',
            confirmButtonColor: '#d33'
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An unexpected error occurred. Please try again.',
          confirmButtonColor: '#d33'
        });
      } finally {
        this.isSubmitting = false;
        this.detectChanges();
      }
    } else {
      this.requestForm.markAllAsTouched();
    }
  }

  saveDraft(): void {
    Swal.fire({
      icon: 'info',
      title: 'Draft Saved',
      text: 'Your request has been saved as a draft.',
      confirmButtonColor: '#3085d6'
    });
  }
}
