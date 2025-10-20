import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

/** Basic pair used by selects */
export interface IdName {
  id: string | number;
  name: string;
}

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

interface MenuItem {
  id: number;
  value: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class LookupService {
  // ===================== 🌍 GEO LOOKUPS ===================== //
  private statesCache: IdName[] | null = null;
  private countiesByState = new Map<string | number, IdName[]>();
  private payamsByCounty = new Map<string | number, IdName[]>();
  private bomasByPayam = new Map<string | number, IdName[]>();

  private readonly GEO_SEARCH_URL = '/api/lookup/geo/search';
  private readonly MENU_FIND_ALL_URL = '/api/menus/findAll';

  constructor(private api: ApiService) {}

  // ---------- PUBLIC GEO LOOKUP METHODS ----------

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

  clearAllCaches() {
    this.statesCache = null;
    this.countiesByState.clear();
    this.payamsByCounty.clear();
    this.bomasByPayam.clear();
  }

  // ---------- INTERNAL GEO SEARCH ----------

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
      'global',
      { headers }
    );

    const data = res.data;

    if (!data?.operationResult) {
      throw new Error(data?.errorMsg || 'Lookup failed');
    }

    return (data.lookups || []).map((it: any) => ({
      id: it.id,
      name: it.name
    }));
  }

  // ---------- HELPERS FOR USER / ROLE ----------

  private getUserId(): string {
    const user = this.api.loginState()?.user as any;
    return String(user?.userId ?? user?.sub ?? user?.oid ?? '');
  }

  private getRoleId(): string {
    const user = this.api.loginState()?.user as any;
    return String(user?.roleId ?? (Array.isArray(user?.roles) ? user.roles[0] : '') ?? '');
  }

  // ===================== 📋 MENU LOOKUPS ===================== //

  /** Cached menu list (replaces hardcoded UserPermissionEnum) */
 private menuListCache: MenuItem[] | null = null;

/** ✅ Fetch menu list dynamically from backend */
async getMenuList(): Promise<MenuItem[]> {
  if (this.menuListCache && this.menuListCache.length > 0) {
    return this.menuListCache;
  }

  console.log('📡 Calling /api/menus/findAll ...');

  const res = await this.api.GET<any>(this.MENU_FIND_ALL_URL, {}, 'alt');
  const data = res.data;

  if (res.status !== 200 || !data?.data) {
    throw new Error('Failed to fetch menu list');
  }

  const rawMenus = data.data as any[];

  // ✅ Include all menus (even parents with null URL)
  this.menuListCache = rawMenus.map((menu: any) => ({
    id: menu.id,
    value: menu.url ?? `parent-${menu.id}`, // fallback value for null URLs
    label: menu.name,
  }));

  console.log('✅ Menu list loaded:', this.menuListCache.length, 'items');
  return this.menuListCache;
}


/** Get label by menu URL */
getMenuLabelByValue(value: string): string {
  // Optional chaining safely handles null cache
  const found = this.menuListCache?.find((m) => m.value === value);
  return found ? found.label : '--';
}

/** Force refresh menu cache (if admin updates menus) */
clearMenuCache(): void {
  this.menuListCache = null;
}
}
