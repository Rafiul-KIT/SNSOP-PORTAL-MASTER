import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import Swal from 'sweetalert2';
import { Loader } from '../../../components/loader/loader';
import { ITAttachment, ITHistory, ITRequest, ITUserReference, ItSupportService } from '../../../../services/it-support.service';
import { HelpDeskRequestAssignment } from '../request-assignment/help-desk-request-assignment';


type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
type HistoryChange = { field: string; oldValue: string; newValue: string; isInitialValue: boolean };
type UserDisplayRow = { label: string; value: string };

type WorkflowAction = {
  label: string;
  value: string;
  needsComment: boolean;
  actionType: 'status' | 'submit_info';
};

@Component({
  selector: 'app-help-desk-request-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BreadcrumbModule, ButtonModule, TagModule, Loader, HelpDeskRequestAssignment],
  templateUrl: './help-desk-request-details.html',
  styleUrls: ['./help-desk-request-details.scss'],
})
export class HelpDeskRequestDetails implements OnInit {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/dashboard' };
  breadcrumbItems = [{ label: 'Helpdesk', routerLink: '/help-desk/support-management' }, { label: 'Request Detail' }];

  isLoading = true;
  isUpdatingStatus = false;

  detailRequest: ITRequest | null = null;
  detailHistory: ITHistory[] = [];
  detailAttachments: ITAttachment[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private itSupportService: ItSupportService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.router.navigate(['/help-desk/support-management']);
      return;
    }

    await this.loadDetail(id);
  }

  async loadDetail(requestId: number): Promise<void> {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const detail = await this.itSupportService.getRequestById(requestId);

      this.detailRequest = detail;
      this.detailHistory = detail?.history || [];
      this.detailAttachments = detail?.attachments || [];

      if (!detail) {
        await Swal.fire({
          icon: 'warning',
          title: 'Not Found',
          text: 'Request detail not found.',
          confirmButtonColor: '#3085d6',
        });
        this.router.navigate(['/help-desk/support-management']);
        return;
      }
    } catch (error) {
      console.error('Failed to load detail:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Load Failed',
        text: 'Unable to load support request details.',
        confirmButtonColor: '#d33',
      });
      this.router.navigate(['/help-desk/support-management']);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async refreshDetailSilently(requestId: number): Promise<void> {
    try {
      const detail = await this.itSupportService.getRequestById(requestId);

      if (detail) {
        this.detailRequest = detail;
        this.detailAttachments = detail.attachments || [];
      }

      this.detailHistory = detail?.history || [];
    } catch (error) {
      console.error('Failed to refresh detail:', error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async onAssignmentUpdated(updatedRequest: ITRequest): Promise<void> {
    this.detailRequest = updatedRequest;
    this.detailAttachments = updatedRequest.attachments || this.detailAttachments;
    this.cdr.detectChanges();
    await this.refreshDetailSilently(updatedRequest.id);
  }

  private canTransition(fromStatus?: string, toStatus?: string): boolean {
    const from = String(fromStatus || '').toUpperCase();
    const to = String(toStatus || '').toUpperCase();

    if (!from || !to) return false;

    return (
      (from === 'NEW' && to === 'PROCESSING') ||
      (from === 'PROCESSING' && ['REQUIRED_MORE_INFO', 'ADDRESSED', 'CLOSED'].includes(to)) ||
      (from === 'REOPENED' && to === 'PROCESSING')
    );
  }

  getAvailableActions(request: ITRequest): WorkflowAction[] {
    const status = request.status?.toUpperCase() || '';

    switch (status) {
      case 'NEW':
        return [{ label: 'Move to Processing', value: 'PROCESSING', needsComment: false, actionType: 'status' }];
      case 'PROCESSING':
        return [
          { label: 'Ask For More Info', value: 'REQUIRED_MORE_INFO', needsComment: true, actionType: 'status' },
          { label: 'Mark Addressed', value: 'ADDRESSED', needsComment: false, actionType: 'status' },
          { label: 'Close', value: 'CLOSED', needsComment: true, actionType: 'status' },
        ];
      case 'REOPENED':
        return [{ label: 'Move to Processing', value: 'PROCESSING', needsComment: false, actionType: 'status' }];
      default:
        return [];
    }
  }

  getStatusActionLabel(request: ITRequest): string {
    const actions = this.getAvailableActions(request);
    if (!actions.length) return 'No Action';
    if (actions.length === 1) return actions[0].label;
    return 'Take Action';
  }

  getStatusSeverity(status: string | undefined): Severity {
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

  formatStatus(status?: string): string {
    if (!status) return '--';
    return status.replace(/_/g, ' ');
  }

  formatUserReference(value?: ITUserReference): string {
    if (value === null || value === undefined || value === '') return '--';
    if (typeof value !== 'object') return String(value);

    const user = value as Record<string, unknown>;
    const fullName = String(user['fullName'] ?? user['name'] ?? '').trim();
    const username = String(user['username'] ?? user['preferred_username'] ?? user['unique_name'] ?? '').trim();
    const email = String(user['email'] ?? user['mail'] ?? user['upn'] ?? '').trim();
    const role = String(user['roleName'] ?? user['role'] ?? '').trim();
    const name = fullName || username || email;
    if (!name) return '--';

    const details = [username !== name ? username : '', email !== name ? email : '', role]
      .filter(Boolean)
      .join(' | ');
    return details ? `${name} (${details})` : name;
  }

  getUserDisplayRows(value?: ITUserReference): UserDisplayRow[] {
    if (value && typeof value === 'object') {
      const user = value as Record<string, unknown>;
      return [
        { label: 'User', value: String(user['fullName'] ?? user['name'] ?? '').trim() || '--' },
        {
          label: 'Username',
          value: String(user['username'] ?? user['preferred_username'] ?? user['unique_name'] ?? '').trim() || '--',
        },
        { label: 'Email', value: String(user['email'] ?? user['mail'] ?? user['upn'] ?? '').trim() || '--' },
      ];
    }

    const fallback = this.formatUserReference(value);
    return [
      { label: 'User', value: fallback },
      { label: 'Username', value: '--' },
      { label: 'Email', value: '--' },
    ];
  }

  formatDate(value?: string): string {
    if (!value) return '--';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-GB');
  }

  getCreatedAt(request?: ITRequest | null): string {
    if (!request) return '';
    const anyRequest = request as any;
    return anyRequest.createdAt || anyRequest.createdDate || anyRequest.creationDate || anyRequest.created_on || '';
  }

  getCategoryDisplay(request?: ITRequest | null): string {
    if (!request) return '--';
    const categoryName = request.categoryName || '--';
    const otherCategory = String(request.otherCategory || '').trim();
    return otherCategory ? `${categoryName} (${otherCategory})` : categoryName;
  }

  private isInitialHistoryValue(value: unknown): boolean {
    const normalized = String(value ?? '').trim().toUpperCase();
    return !normalized || normalized === '-' || normalized === 'NULL' || normalized === 'INITIAL';
  }

  private formatHistoryValue(value: unknown, fallback = '-'): string {
    if (value && typeof value === 'object') return this.formatUserReference(value as ITUserReference);
    if (this.isInitialHistoryValue(value)) return fallback;
    return String(value).trim();
  }

parseHistoryChanges(changes?: string): HistoryChange[] {
  if (!changes) return [];
  try {
    const parsed = JSON.parse(changes);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: any) => {
      const isInitialValue = this.isInitialHistoryValue(item?.oldValue);
      // Determine field name
      let fieldName = String(item?.field || '-').replace(/_/g, ' ');
      if (fieldName.toLowerCase() === 'categoryid') {
        fieldName = 'category';
      }

      return {
        field: fieldName,
        oldValue: isInitialValue ? 'Initial' : this.formatHistoryValue(item?.oldValue),
        newValue: this.formatHistoryValue(item?.newValue),
        isInitialValue,
      };
    });
  } catch {
    return [];
  }
}

  getTimelineTitle(action?: string): string {
    switch (String(action || '').toUpperCase()) {
      case 'INITIAL':
        return 'Initial Update';
      case 'CREATED':
        return 'Request Created';
      case 'ATTACHMENT_ADDED':
        return 'Attachment Added';
      case 'STATUS_CHANGED':
        return 'Status Changed';
      default:
        return this.formatStatus(action);
    }
  }

  getTimelineIcon(action?: string): string {
    switch (String(action || '').toUpperCase()) {
      case 'INITIAL':
        return 'fas fa-flag';
      case 'CREATED':
        return 'fas fa-plus';
      case 'ATTACHMENT_ADDED':
        return 'fas fa-paperclip';
      case 'STATUS_CHANGED':
        return 'fas fa-arrows-rotate';
      default:
        return 'fas fa-circle';
    }
  }

  getTimelineTone(action?: string): string {
    switch (String(action || '').toUpperCase()) {
      case 'INITIAL':
      case 'CREATED':
        return 'created';
      case 'ATTACHMENT_ADDED':
        return 'attachment';
      case 'STATUS_CHANGED':
        return 'status';
      default:
        return 'default';
    }
  }

  async onAction(request: ITRequest): Promise<void> {
    const actions = this.getAvailableActions(request);
    if (!actions.length) return;

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
      selectedAction = actions.find((a) => a.value === selectedValue) || actions[0];
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

    if (selectedAction.actionType === 'submit_info') {
      const result = await Swal.fire({
        title: 'Submit Required Information',
        html: `
          <div style="text-align: left; font-family: inherit;">
            <p style="font-size: 0.9rem; color: #6c757d; margin-bottom: 1.25rem; border-bottom: 1px solid #e9ecef; padding-bottom: 0.5rem;">
              <i class="fas fa-circle-info" style="color: #3b82f6; margin-right: 6px;"></i>
              Please provide at least one of the following to update your request.
            </p>
            
            <div style="margin-bottom: 1rem;">
              <label for="submit-info-comment" style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #374151;">Workflow Comment</label>
              <textarea id="submit-info-comment" class="swal2-textarea" style="width: 100%; height: 80px; margin: 0; padding: 0.75rem; font-size: 0.9rem; border-radius: 8px; border: 1px solid #d1d5db;" placeholder="Describe your updates or response..."></textarea>
            </div>

            <div style="margin-bottom: 1rem;">
              <label for="submit-info-description" style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #374151;">Updated Description (Optional)</label>
              <textarea id="submit-info-description" class="swal2-textarea" style="width: 100%; height: 80px; margin: 0; padding: 0.75rem; font-size: 0.9rem; border-radius: 8px; border: 1px solid #d1d5db;" placeholder="If you need to update the original description..."></textarea>
            </div>

            <div style="margin-bottom: 0.5rem;">
              <label for="submit-info-files" style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #374151;">Attachments (Optional)</label>
              <input id="submit-info-files" type="file" class="swal2-file" style="width: 100%; margin: 0; font-size: 0.85rem; border: 1px solid #d1d5db; border-radius: 8px; padding: 0.5rem;" multiple />
              <div style="font-size: 0.75rem; color: #9ca3af; mt-1">Select one or more files to upload.</div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Submit Info',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6e7881',
        width: '500px',
        preConfirm: () => {
          const commentValue = String((document.getElementById('submit-info-comment') as HTMLTextAreaElement)?.value || '').trim();
          const descriptionValue = String((document.getElementById('submit-info-description') as HTMLTextAreaElement)?.value || '').trim();
          const files = Array.from((document.getElementById('submit-info-files') as HTMLInputElement)?.files || []);
          if (!commentValue && !descriptionValue && !files.length) {
            Swal.showValidationMessage('Please provide at least a comment, description, or attachment.');
            return null;
          }
          return { commentValue, descriptionValue, files };
        },
      });

      if (!result.isConfirmed || !result.value) return;

      this.isLoading = true;
      this.cdr.detectChanges();
      try {
        const submitResponse = await this.itSupportService.submitInfo(
          request.id,
          {
            comment: result.value.commentValue || undefined,
            description: result.value.descriptionValue || undefined,
          },
          result.value.files || []
        );

        if (submitResponse.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Information Submitted',
            text: submitResponse.message || 'Required information submitted and status moved to PROCESSING.',
            confirmButtonColor: '#3085d6',
          });
          await this.loadDetail(request.id);
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Submit Failed',
            text: submitResponse.message || 'Unable to submit required information.',
            confirmButtonColor: '#d33',
          });
        }
      } catch {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An unexpected error occurred while submitting required information.',
          confirmButtonColor: '#d33',
        });
      } finally {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
      return;
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

    this.isUpdatingStatus = true;
    this.cdr.detectChanges();

    let response: { success: boolean; request?: ITRequest; message?: string } | null = null;
    let hasUnexpectedError = false;

    try {
      response = await this.itSupportService.updateRequestStatus(request.id, {
        status: selectedAction.value,
        ...(comment ? { comment } : {}),
      });
    } catch {
      hasUnexpectedError = true;
    } finally {
      this.isUpdatingStatus = false;
      this.cdr.detectChanges();
    }

    if (hasUnexpectedError) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred while updating status.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    if (response?.success) {
      if (response.request) {
        this.detailRequest = response.request;
        this.detailAttachments = response.request.attachments || this.detailAttachments;
        this.cdr.detectChanges();
      }

      await Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: response.message || 'Request status updated successfully.',
        confirmButtonColor: '#3085d6',
      });
      await this.refreshDetailSilently(request.id);
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: response?.message || 'Unable to update request status.',
        confirmButtonColor: '#d33',
      });
    }
  }

  async downloadAttachment(attachment: ITAttachment): Promise<void> {
    if (!this.detailRequest) return;

    const blob = await this.itSupportService.downloadAttachment(this.detailRequest.id, attachment.id);
    if (!blob) {
      await Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Unable to download attachment.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.originalFileName || `attachment-${attachment.id}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
