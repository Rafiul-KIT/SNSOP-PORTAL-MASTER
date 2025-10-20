import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

/** Basic pair used by selects */
export interface IdName { id: string | number; name: string; }

/** Request/Response shapes per your Swagger screenshots */
type GeoLookupType = 'STATE' | 'COUNTY' | 'PAYAM' | 'BOMA';

interface GetLookupRequest {
  lookupType: GeoLookupType;
  id?: string;
  parentId?: string | number | null;
  name?: string;
  page?: number;
  size?: number;
}

interface GetLookupResponse {
  operationResult: boolean;
  errorMsg?: string;
  errorCode?: number;
  lookups: IdName[];
  totalCount: number;
}

@Injectable({ providedIn: 'root' })
export class LookupService {
  /** Simple caches to avoid refetching */
  private statesCache: IdName[] | null = null;
  private countiesByState = new Map<string | number, IdName[]>();
  private payamsByCounty = new Map<string | number, IdName[]>();
  private bomasByPayam = new Map<string | number, IdName[]>();

  /** Endpoint path (change if your gateway/path differs) */
  private readonly GEO_SEARCH_URL = '/api/lookup/geo/search';

  constructor(private api: ApiService) { }

  // ---------- PUBLIC API USED BY THE FORM ----------

  async getStateList(size = 200): Promise<IdName[]> {
    if (this.statesCache) return this.statesCache;
    this.statesCache = await this.geoSearch('STATE', null, size);
    return this.statesCache;
  }

  async getCountyListByStateId(stateId: string | number, size = 500): Promise<IdName[]> {
    if (this.countiesByState.has(stateId)) return this.countiesByState.get(stateId)!;
    const list = await this.geoSearch('COUNTY', stateId, size);
    this.countiesByState.set(stateId, list);
    return list;
  }

  async getPayamListByCountyId(countyId: string | number, size = 1000): Promise<IdName[]> {
    if (this.payamsByCounty.has(countyId)) return this.payamsByCounty.get(countyId)!;
    const list = await this.geoSearch('PAYAM', countyId, size);
    this.payamsByCounty.set(countyId, list);
    return list;
  }

  async getBomaListByPayamId(payamId: string | number, size = 2000): Promise<IdName[]> {
    if (this.bomasByPayam.has(payamId)) return this.bomasByPayam.get(payamId)!;
    const list = await this.geoSearch('BOMA', payamId, size);
    this.bomasByPayam.set(payamId, list);
    return list;
  }

  /** Clear caches if lookups change (e.g., admin updated master data) */
  clearAllCaches() {
    this.statesCache = null;
    this.countiesByState.clear();
    this.payamsByCounty.clear();
    this.bomasByPayam.clear();
  }

  // ---------- INTERNAL: single endpoint wrapper ----------

  /**
   * Calls POST /api/lookup/geo/search with X-User-Id & X-Role-Id headers.
   * parentId is required for everything except STATE.
   */
  private async geoSearch(
    lookupType: GeoLookupType,
    parentId: string | number | null,
    size = 1000
  ): Promise<IdName[]> {
    const payload: GetLookupRequest = {
      lookupType,
      parentId: parentId ?? null,
      page: 0,
      size
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-User-Id': this.getUserId(),
      'X-Role-Id': this.getRoleId(),
    };

    const res = await this.api.POST<GetLookupResponse>(
      this.GEO_SEARCH_URL,
      payload,
      'global',                 // omit if your ApiService defaults to global
      { headers }               // optional AxiosRequestConfig
    );
    const data = res.data;

    if (!data?.operationResult) {
      throw new Error(data?.errorMsg || 'Lookup failed');
    }

    // Normalize just in case backend returns different key casing
    return (data.lookups || []).map((it: any) => ({
      id: it.id,
      name: it.name
    }));
  }

  // ---------- HELPERS: extract user/role for headers ----------

  /**
   * Adjust these two to match your token/user shape.
   * Examples:
   *  - Azure AD: this.api.loginState().user?.oid / roles[0]
   *  - Your JWT: this.api.loginState().user?.userId / roleId
   */
  private getUserId(): string {
    const user = this.api.loginState()?.user as any;
    // Try a few common fields; change to your canonical one
    return String(user?.userId ?? user?.sub ?? user?.oid ?? '');
  }

  private getRoleId(): string {
    const user = this.api.loginState()?.user as any;
    // If your JWT has a single role id, use that.
    // If it's an array, pick the first or the one you need.
    return String(user?.roleId ?? (Array.isArray(user?.roles) ? user.roles[0] : '') ?? '');
  }

  UserPermissionEnum = [
    // 👤 User Management
{ id: 1, value: 'user-management/roles', label: "Role List" },
{ id: 2, value: 'user-management/role-link', label: "Role Link" },
{ id: 3, value: 'user-management/add-new-role', label: "Add New Role" },
{ id: 4, value: 'user-management/users', label: "User List" },
{ id: 5, value: 'user-management/register', label: "Register User" },

    // 📊 Dashboard
    { id: 6, value: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },

    // 🧍 Beneficiary Management
    { id: 7, value: 'beneficiary', label: 'Beneficiary', icon: 'fas fa-users' },
    { id: 8, value: 'beneficiary/list', label: 'Beneficiary List', icon: 'fas fa-list' },

    // ⚖️ Adjudication
    { id: 9, value: 'adjudication-list', label: 'Adjudication', icon: 'fas fa-balance-scale' },

    // 📋 Audit & Approval
    { id: 10, value: 'beneficiary-audit', label: 'Beneficiary Audit', icon: 'fas fa-file-audio' },
    { id: 11, value: 'beneficiary-audit/audit', label: 'Audit List', icon: 'fas fa-clipboard-list' },
    { id: 12, value: 'beneficiary-approval', label: 'Approval List', icon: 'fas fa-user-check' },
    { id: 13, value: 'beneficiary-approval/list', label: 'List', icon: 'fas fa-list-check' },

    // 🗂 Archived / Restore
    { id: 14, value: 'restore', label: 'Archived Beneficiary', icon: 'fas fa-trash-restore' },
    { id: 15, value: 'restore/list', label: 'Archived List', icon: 'fas fa-archive' },
  ];

  getUserPermissionEnum = () => {
    return this.UserPermissionEnum;
  }
  getUserPermissionEnumByValue = (value: any) => {
    const dataFpund = this.UserPermissionEnum.find((sce: any) => sce.value == value);
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  }
}
