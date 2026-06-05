import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import Swal from 'sweetalert2';
import { Loader } from '../../../components/loader/loader';
import { ITCategory, ITModule, ITRequest, ITSubmodule, ItSupportService } from '../../../../services/it-support.service';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

type WorkflowAction = {
  label: string;
  value: string;
  needsComment: boolean;
};

type LookupOption = {
  label: string;
  value: number;
};

@Component({
  selector: 'app-help-desk-assigned-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    InputTextModule,
    PaginatorModule,
    SelectModule,
    TableModule,
    TagModule,
    Loader,
  ],
  templateUrl: './help-desk-assigned-requests.html',
  styleUrls: ['./help-desk-assigned-requests.scss'],
})
export class HelpDeskAssignedRequests implements OnInit {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Helpdesk' }, { label: 'Request List' }];

  isLoading = false;
  requests: ITRequest[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 20;

  searchText = '';
  trackingNumber = '';
  selectedStatus: string | null = null;
  selectedPriority: string | null = null;
  selectedIssueType: string | null = null;
  selectedCategoryId: number | null = null;
  selectedModuleId: number | null = null;
  selectedSubmoduleId: number | null = null;

  categories: LookupOption[] = [];
  modules: LookupOption[] = [];
  submodules: Array<LookupOption & { parentModuleId: number }> = [];

  statuses = [
    { label: 'All', value: null },
    { label: 'New', value: 'NEW' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Required More Info', value: 'REQUIRED_MORE_INFO' },
    { label: 'Addressed', value: 'ADDRESSED' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Reopened', value: 'REOPENED' },
  ];

  priorityOptions = [
    { label: 'All', value: null },
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
  ];

  issueTypeOptions = [
    { label: 'All', value: null },
    { label: 'Technical', value: 'TECHNICAL' },
    { label: 'Operational', value: 'OPERATIONAL' },
    { label: 'Support', value: 'SUPPORT' },
  ];

  constructor(
    private itSupportService: ItSupportService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFilterLookups();
    this.loadAssignedRequests();
  }

  private detectChanges(): void {
    this.cdr.detectChanges();
  }

  async loadAssignedRequests(): Promise<void> {
    this.isLoading = true;
    this.detectChanges();

    const params: any = {
      page: this.currentPage,
      size: this.pageSize,
    };

    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedPriority) params.priority = this.selectedPriority;
    if (this.selectedIssueType) params.issueType = this.selectedIssueType;
    if (this.selectedCategoryId) params.categoryId = this.selectedCategoryId;
    if (this.selectedModuleId) params.moduleId = this.selectedModuleId;
    if (this.selectedSubmoduleId) params.submoduleId = this.selectedSubmoduleId;
    if (this.trackingNumber.trim()) params.trackingNumber = this.trackingNumber.trim();
    if (this.searchText.trim()) params.search = this.searchText.trim();

    try {
      const result = await this.itSupportService.getAssignedRequests(params);
      this.requests = result.items;
      this.totalRecords = result.total;
    } catch (error) {
      console.error('Error loading assigned requests:', error);
      this.requests = [];
      this.totalRecords = 0;
    } finally {
      this.isLoading = false;
      this.detectChanges();
    }
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadAssignedRequests();
  }

  resetFilters(): void {
    this.searchText = '';
    this.trackingNumber = '';
    this.selectedStatus = null;
    this.selectedPriority = null;
    this.selectedIssueType = null;
    this.selectedCategoryId = null;
    this.selectedModuleId = null;
    this.selectedSubmoduleId = null;
    this.applyFilters();
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadAssignedRequests();
  }

  onModuleFilterChange(): void {
    this.selectedSubmoduleId = null;
  }

  get filteredSubmoduleOptions(): Array<LookupOption & { parentModuleId: number }> {
    if (!this.selectedModuleId) return this.submodules;
    return this.submodules.filter((submodule) => Number(submodule.parentModuleId) === Number(this.selectedModuleId));
  }

  private async loadFilterLookups(): Promise<void> {
    try {
      const [categories, modules, submodules] = await Promise.all([
        this.itSupportService.getCategories(),
        this.itSupportService.getModules(),
        this.itSupportService.getSubmodules(),
      ]);

      this.categories = categories.map((category: ITCategory) => ({ label: category.name, value: category.id }));
      this.modules = modules.map((module: ITModule) => ({ label: module.name, value: module.id }));
      this.submodules = submodules.map((submodule: ITSubmodule) => ({
        label: submodule.name,
        value: submodule.id,
        parentModuleId: submodule.parentModuleId,
      }));
    } catch (error) {
      console.error('Failed to load assigned request filters:', error);
    } finally {
      this.detectChanges();
    }
  }

  getStatusSeverity(status?: string): Severity {
    switch (status?.toUpperCase()) {
      case 'NEW':
        return 'info';
      case 'PROCESSING':
        return 'warn';
      case 'REQUIRED_MORE_INFO':
        return 'danger';
      case 'ADDRESSED':
        return 'secondary';
      case 'RESOLVED':
      case 'CLOSED':
        return 'success';
      case 'REOPENED':
        return 'contrast';
      default:
        return 'secondary';
    }
  }

  getPrioritySeverity(priority?: string): Severity {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warn';
      case 'LOW':
        return 'info';
      default:
        return 'secondary';
    }
  }

  getCategoryDisplay(request?: ITRequest | null): string {
    if (!request) return '--';
    const categoryName = request.categoryName || '--';
    const otherCategory = String(request.otherCategory || '').trim();
    return otherCategory ? `${categoryName} (${otherCategory})` : categoryName;
  }

  formatStatus(status?: string): string {
    if (!status) return '--';
    return status.replace(/_/g, ' ');
  }

  formatIssueType(issueType?: string): string {
    if (!issueType) return '--';
    return issueType.replace(/_/g, ' ');
  }

  getAssignedUserDisplay(request?: ITRequest | null): string {
    if (!request) return '--';
    const assignedTo = request.assignedTo;

    if (assignedTo && typeof assignedTo === 'object') {
      return assignedTo.fullName || assignedTo.username || '--';
    }

    return request.assignedUserName || request.assignedToName || request.assigneeName || '--';
  }

  getAssignedMetaDisplay(request?: ITRequest | null): string {
    if (!request) return '';
    const assignedTo = request.assignedTo;

    if (assignedTo && typeof assignedTo === 'object') {
      return assignedTo.email || '';
    }

    return request.assignedUserEmail || '';
  }

  private canTransition(fromStatus?: string, toStatus?: string): boolean {
    const from = String(fromStatus || '').toUpperCase();
    const to = String(toStatus || '').toUpperCase();

    if (!from || !to) return false;

    return (
      (from === 'NEW' && to === 'PROCESSING') ||
      (from === 'PROCESSING' && ['REQUIRED_MORE_INFO', 'ADDRESSED', 'CLOSED'].includes(to)) ||
      (from === 'REOPENED' && to === 'PROCESSING') ||
      (from === 'ADDRESSED' && to === 'RESOLVED') ||
      (from === 'RESOLVED' && to === 'CLOSED') ||
      (from === 'CLOSED' && to === 'REOPENED')
    );
  }

  getAvailableActions(request: ITRequest): WorkflowAction[] {
    const status = request.status?.toUpperCase() || '';

    switch (status) {
      case 'NEW':
        return [{ label: 'Move to Processing', value: 'PROCESSING', needsComment: false }];
      case 'PROCESSING':
        return [
          { label: 'Ask For More Info', value: 'REQUIRED_MORE_INFO', needsComment: true },
          { label: 'Mark Addressed', value: 'ADDRESSED', needsComment: false },
          { label: 'Close', value: 'CLOSED', needsComment: true },
        ];
      case 'REOPENED':
        return [{ label: 'Move to Processing', value: 'PROCESSING', needsComment: false }];
      case 'ADDRESSED':
        return [{ label: 'Mark Resolved', value: 'RESOLVED', needsComment: false }];
      case 'RESOLVED':
        return [{ label: 'Close', value: 'CLOSED', needsComment: true }];
      case 'CLOSED':
        return [{ label: 'Reopen', value: 'REOPENED', needsComment: true }];
      default:
        return [];
    }
  }

  getStatusActionLabel(request: ITRequest): string {
    const actions = this.getAvailableActions(request);
    if (!actions.length) return 'No Action';
    if (actions.length === 1) return actions[0].label;
    return 'Change Status';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getCreatedAt(request?: ITRequest | null): string {
    if (!request) return '';
    const anyRequest = request as any;
    return anyRequest.createdAt || anyRequest.createdDate || anyRequest.creationDate || anyRequest.created_on || '';
  }

  async onView(request: ITRequest): Promise<void> {
    await this.router.navigate(['/help-desk/request-details', request.id]);
  }

  async onAction(request: ITRequest): Promise<void> {
    const actions = this.getAvailableActions(request);

    if (!actions.length) {
      await Swal.fire({
        icon: 'info',
        title: 'No Transition Available',
        text: 'This request has no workflow transition from its current status.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    let selectedAction = actions[0];

    if (actions.length > 1) {
      const { value: selectedValue } = await Swal.fire({
        title: 'Select Next Status',
        input: 'select',
        inputOptions: actions.reduce((acc, action) => {
          acc[action.value] = `${action.label} (${action.value})`;
          return acc;
        }, {} as Record<string, string>),
        inputPlaceholder: 'Select transition',
        showCancelButton: true,
        confirmButtonText: 'Continue',
        confirmButtonColor: '#3085d6',
        inputValidator: (value) => (!value ? 'Please select a status transition.' : null),
      });

      if (!selectedValue) return;
      selectedAction = actions.find((action) => action.value === selectedValue) || actions[0];
    }

    let comment = '';
    if (selectedAction.needsComment) {
      const result = await Swal.fire({
        title: 'Comment Required',
        input: 'textarea',
        inputLabel: `Provide comment for ${selectedAction.value}`,
        inputPlaceholder: 'Type workflow comment',
        showCancelButton: true,
        confirmButtonText: 'Update Status',
        confirmButtonColor: '#3085d6',
        inputValidator: (value) => (!value?.trim() ? 'Comment is required for this transition.' : null),
      });

      if (!result.isConfirmed) return;
      comment = String(result.value || '').trim();
    }

    if (!this.canTransition(request.status, selectedAction.value)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Transition',
        text: `Invalid status transition from ${request.status} to ${selectedAction.value}.`,
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    this.isLoading = true;
    this.detectChanges();

    try {
      const response = await this.itSupportService.updateRequestStatus(request.id, {
        status: selectedAction.value,
        ...(comment ? { comment } : {}),
      });

      this.isLoading = false;
      this.detectChanges();

      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: response.message || 'Request status updated successfully.',
          confirmButtonColor: '#3085d6',
        });
        await this.loadAssignedRequests();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: response.message || 'Unable to update request status.',
          confirmButtonColor: '#d33',
        });
      }
    } catch {
      this.isLoading = false;
      this.detectChanges();

      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred while updating status.',
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isLoading = false;
      this.detectChanges();
    }
  }
}
