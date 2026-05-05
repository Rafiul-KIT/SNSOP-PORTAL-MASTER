import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface ITCategory {
  id: number;
  name: string;
  description: string;
}

export interface ITModule {
  id: number;
  name: string;
  description: string;
}

export interface ITSubmodule {
  id: number;
  parentModuleId: number;
  name: string;
  description: string;
}

export interface ITAttachment {
  id: number;
  requestId: number;
  path: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  createdBy: number;
  createdAt: string;
  downloadUrl: string;
}

export interface ITHistory {
  id: number;
  requestId: number;
  action: string;
  changes: string;
  comment: string;
  performedBy: number;
  performedAt: string;
}

export interface ITRequest {
  id: number;
  trackingNumber: string;
  title: string;
  description: string;
  issueType?: 'TECHNICAL' | 'OPERATIONAL' | 'OTHER' | string;
  categoryId: number;
  categoryName: string;
  otherCategory?: string | null;
  moduleId: number;
  moduleName: string;
  submoduleId?: number;
  submoduleName?: string;
  priority: string;
  status: string;
  comment: string;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  updatedAt: string;
  assignedUserId?: number;
  assignedTo?: number;
  assigneeId?: number;
  assignedUserName?: string;
  assignedToName?: string;
  assigneeName?: string;
  assignedUserEmail?: string;
  assignedUserRole?: string;
  attachmentCount?: number;
  attachments?: ITAttachment[];
  history?: ITHistory[];
}

export interface ITPagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ITApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  path: string;
  data: T;
  pagination?: ITPagination;
}

export interface ITSearchParams {
  status?: string;
  categoryId?: number;
  moduleId?: number;
  priority?: string;
  trackingNumber?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface ITDashboardCount {
  totalRequests: number;
  resolvedRequests: number;
}

export interface ITDashboardModuleSummary {
  moduleId: number;
  moduleName: string;
  totalRequests: number;
  resolvedRequests: number;
}

export interface ITDashboardMonthReport {
  month: string;
  year: number;
  monthNumber: number;
  reportedCount: number;
}

export interface ITDashboardData {
  totalRequests: number;
  countsByStatus: Record<string, ITDashboardCount>;
  requestsByModule: ITDashboardModuleSummary[];
  reportedIssuesLastSixMonths: ITDashboardMonthReport[];
  countsByPriority: Record<string, ITDashboardCount>;
}

export interface ITReportSummaryRow {
  reportType: string;
  currentMonth: number;
  previousMonth: number;
  trend: number;
}

export interface ITLookupPayload {
  name: string;
  description: string;
}

export interface ITSubmodulePayload extends ITLookupPayload {
  parentModuleId: number;
}

@Injectable({
  providedIn: 'root',
})
export class ItSupportService {
  private readonly baseEndpoint = 'api/v1/it-support';

  constructor(private api: ApiService) {}

  private parseApiResponse<T>(res: any): ITApiResponse<T> | null {
    const response = res?.data;
    if (response && typeof response === 'object' && 'success' in response) {
      return response as ITApiResponse<T>;
    }
    return null;
  }

  private isSuccessfulResponse(res: any, response?: ITApiResponse<unknown> | null): boolean {
    if (response) return response.success;

    const status = Number(res?.status);
    return Number.isFinite(status) && status >= 200 && status < 300;
  }

  private appendFiles(formData: FormData, files?: File[]): void {
    if (!files?.length) return;

    files.forEach((file) => {
      if (file) {
        formData.append('files', file, file.name);
      }
    });
  }

  async getCategories(): Promise<ITCategory[]> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/categories`);
      const response = this.parseApiResponse<ITCategory[]>(res);
      return response?.success && Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  }

  async getModules(): Promise<ITModule[]> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/modules`);
      const response = this.parseApiResponse<ITModule[]>(res);
      return response?.success && Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  }

  async getSubmodules(): Promise<ITSubmodule[]> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/submodules`);
      const response = this.parseApiResponse<ITSubmodule[]>(res);
      return response?.success && Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  }

  async createCategory(payload: ITLookupPayload): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await this.api.POST<any>(`${this.baseEndpoint}/categories`, {
        name: payload.name,
        description: payload.description,
      });
      const response = this.parseApiResponse<unknown>(res);

      return {
        success: this.isSuccessfulResponse(res, response),
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to create category',
      };
    }
  }

  async updateCategory(categoryId: number, payload: ITLookupPayload): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await this.api.PUT<any>(`${this.baseEndpoint}/categories/${categoryId}`, {
        name: payload.name,
        description: payload.description,
      });
      const response = this.parseApiResponse<unknown>(res);

      return {
        success: this.isSuccessfulResponse(res, response),
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to update category',
      };
    }
  }

  async createModule(payload: ITLookupPayload): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await this.api.POST<any>(`${this.baseEndpoint}/modules`, {
        id: 0,
        name: payload.name,
        description: payload.description,
      });
      const response = this.parseApiResponse<unknown>(res);

      return {
        success: this.isSuccessfulResponse(res, response),
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to create module',
      };
    }
  }

  async updateModule(id: number, payload: ITLookupPayload): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await this.api.PUT<any>(`${this.baseEndpoint}/modules/${id}`, {
        id,
        name: payload.name,
        description: payload.description,
      });
      const response = this.parseApiResponse<unknown>(res);

      return {
        success: this.isSuccessfulResponse(res, response),
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to update module',
      };
    }
  }

  async createSubmodule(payload: ITSubmodulePayload): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await this.api.POST<any>(`${this.baseEndpoint}/submodules`, {
        id: 0,
        parentModuleId: payload.parentModuleId,
        name: payload.name,
        description: payload.description,
      });
      const response = this.parseApiResponse<unknown>(res);

      return {
        success: this.isSuccessfulResponse(res, response),
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to create submodule',
      };
    }
  }

  async updateSubmodule(id: number, payload: ITSubmodulePayload): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await this.api.PUT<any>(`${this.baseEndpoint}/submodules/${id}`, {
        id,
        parentModuleId: payload.parentModuleId,
        name: payload.name,
        description: payload.description,
      });
      const response = this.parseApiResponse<unknown>(res);

      return {
        success: this.isSuccessfulResponse(res, response),
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to update submodule',
      };
    }
  }

  async getRequests(params: ITSearchParams = {}): Promise<{ items: ITRequest[]; total: number; pagination?: ITPagination }> {
    const queryParams: Record<string, any> = {};

    if (params.status) queryParams['status'] = params.status;
    if (params.categoryId) queryParams['categoryId'] = params.categoryId;
    if (params.moduleId) queryParams['moduleId'] = params.moduleId;
    if (params.priority) queryParams['priority'] = params.priority;
    if (params.trackingNumber) queryParams['trackingNumber'] = params.trackingNumber;
    if (params.search) queryParams['search'] = params.search;
    if (params.page !== undefined) queryParams['page'] = params.page;
    if (params.size !== undefined) queryParams['size'] = params.size;

    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/requests`, queryParams);
      const response = this.parseApiResponse<ITRequest[]>(res);

      if (response?.success) {
        const items = Array.isArray(response.data) ? response.data : [];
        const total = response.pagination?.totalElements ?? items.length;
        return { items, total, pagination: response.pagination };
      }

      return { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  }

  async getRequestById(id: number): Promise<ITRequest | null> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/requests/${id}`);
      const response = this.parseApiResponse<ITRequest>(res);
      return response?.success ? response.data : null;
    } catch {
      return null;
    }
  }

  async getRequestByTrackingNumber(trackingNumber: string): Promise<ITRequest | null> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/requests/tracking/${trackingNumber}`);
      const response = this.parseApiResponse<ITRequest>(res);
      return response?.success ? response.data : null;
    } catch {
      return null;
    }
  }

  async getRequestHistory(id: number): Promise<ITHistory[]> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/requests/${id}/history`);
      const response = this.parseApiResponse<ITHistory[]>(res);
      return response?.success && Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  }

  async getDashboard(): Promise<ITDashboardData | null> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/dashboard`);
      const response = this.parseApiResponse<ITDashboardData>(res);
      return response?.success ? response.data : null;
    } catch {
      return null;
    }
  }

  async getReportSummary(month?: string): Promise<ITReportSummaryRow[]> {
    const queryParams: Record<string, any> = {};
    if (month?.trim()) {
      queryParams['month'] = month.trim();
    }

    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/report/summary`, queryParams);
      const response = this.parseApiResponse<ITReportSummaryRow[]>(res);
      return response?.success && Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  }

  async getReportSummaryPdf(month?: string): Promise<Blob | null> {
    const queryParams: Record<string, any> = {};
    if (month?.trim()) {
      queryParams['month'] = month.trim();
    }

    try {
      const res = await this.api.GET<Blob>(
        `${this.baseEndpoint}/report/summary/pdf`,
        queryParams,
        'global',
        { responseType: 'blob' }
      );
      return (res as any)?.data || null;
    } catch {
      return null;
    }
  }

  async getReportSummaryCsv(month?: string): Promise<Blob | null> {
    const queryParams: Record<string, any> = {};
    if (month?.trim()) {
      queryParams['month'] = month.trim();
    }

    try {
      const res = await this.api.GET<Blob>(
        `${this.baseEndpoint}/report/summary/csv`,
        queryParams,
        'global',
        { responseType: 'blob' }
      );
      return (res as any)?.data || null;
    } catch {
      return null;
    }
  }

  async createRequest(payload: {
    title: string;
    description: string;
    issueType: string;
    categoryId: number;
    otherCategory?: string | null;
    moduleId: number;
    submoduleId: number;
    priority: string;
    files?: File[];
  }): Promise<{ success: boolean; request?: ITRequest; trackingNumber?: string; message?: string }> {
    try {
      const formData = new FormData();

      const requestPayload = {
        title: payload.title,
        description: payload.description,
        issueType: payload.issueType,
        categoryId: payload.categoryId,
        otherCategory: payload.otherCategory ?? null,
        moduleId: payload.moduleId,
        submoduleId: payload.submoduleId,
        priority: payload.priority,
      };

      formData.append('payload', new Blob([JSON.stringify(requestPayload)], { type: 'application/json' }));
      this.appendFiles(formData, payload.files);

      const res = await this.api.POST_FORM<any>(`${this.baseEndpoint}/requests`, formData);
      const response = this.parseApiResponse<ITRequest>(res);

      return {
        success: response?.success || false,
        request: response?.data,
        trackingNumber: response?.data?.trackingNumber,
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to create request',
      };
    }
  }

  async updateRequest(
    id: number,
    payload: { description: string; categoryId: number; otherCategory?: string | null; moduleId: number; priority: string }
  ): Promise<{ success: boolean; request?: ITRequest; message?: string }> {
    try {
      const res = await this.api.PUT<any>(`${this.baseEndpoint}/requests/${id}`, payload);
      const response = this.parseApiResponse<ITRequest>(res);

      return {
        success: response?.success || false,
        request: response?.data,
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to update request',
      };
    }
  }

  async addAttachments(id: number, files: File[]): Promise<{ success: boolean; request?: ITRequest; message?: string }> {
    try {
      const formData = new FormData();
      this.appendFiles(formData, files);

      const res = await this.api.POST_FORM<any>(`${this.baseEndpoint}/requests/${id}/attachments`, formData);
      const response = this.parseApiResponse<ITRequest>(res);

      return {
        success: response?.success || false,
        request: response?.data,
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to add attachments',
      };
    }
  }

  async downloadAttachment(id: number, attachmentId: number): Promise<Blob | null> {
    try {
      const res = await this.api.GET<Blob>(
        `${this.baseEndpoint}/requests/${id}/attachments/${attachmentId}`,
        undefined,
        'global',
        { responseType: 'blob' }
      );
      return (res as any)?.data || null;
    } catch {
      return null;
    }
  }

  async updateRequestStatus(
    id: number,
    payload: { status: string; comment?: string }
  ): Promise<{ success: boolean; request?: ITRequest; message?: string }> {
    try {
      const res = await this.api.PATCH<any>(`${this.baseEndpoint}/requests/${id}/status`, payload);
      const response = this.parseApiResponse<ITRequest>(res);

      return {
        success: response?.success || false,
        request: response?.data,
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to update status',
      };
    }
  }

  async assignRequest(
    id: number,
    userId: number
  ): Promise<{ success: boolean; request?: ITRequest; message?: string }> {
    try {
      const res = await this.api.PATCH<any>(`${this.baseEndpoint}/request/${id}/assign/${userId}`, {});
      const response = this.parseApiResponse<ITRequest>(res);

      return {
        success: this.isSuccessfulResponse(res, response),
        request: response?.data,
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to assign request',
      };
    }
  }

  async submitInfo(
    id: number,
    payload?: { description?: string; comment?: string },
    files?: File[]
  ): Promise<{ success: boolean; request?: ITRequest; message?: string }> {
    try {
      const formData = new FormData();

      const cleanPayload: { description?: string; comment?: string } = {};
      if (payload?.description?.trim()) cleanPayload.description = payload.description.trim();
      if (payload?.comment?.trim()) cleanPayload.comment = payload.comment.trim();

      if (Object.keys(cleanPayload).length) {
        formData.append('payload', new Blob([JSON.stringify(cleanPayload)], { type: 'application/json' }));
      }

      this.appendFiles(formData, files);

      const res = await this.api.POST_FORM<any>(`${this.baseEndpoint}/requests/${id}/submit-info`, formData);
      const response = this.parseApiResponse<ITRequest>(res);

      return {
        success: response?.success || false,
        request: response?.data,
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to submit required information',
      };
    }
  }
}
