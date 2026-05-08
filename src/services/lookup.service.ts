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
  parentMenu?: any;
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
    parentMenu: menu.parentMenu
  }));

  console.log('✅ Menu list loaded:', this.menuListCache.length, 'items');
  return this.menuListCache;
}


// ===================== M&E DROPDOWN LOOKUPS ===================== //

  get genderOptions() {
    return [
      { label: 'Male', value: 0 },
      { label: 'Female', value: 1 },
    ];
  }

  get selectionCriteriaOptions() {
    return [
      { label: 'LIPW', value: 0 },
      { label: 'DIS', value: 1 },
    ];
  }

  get legalStatusOptions() {
    return [
      { label: 'Host', value: 'HOST' },
      { label: 'Refugee', value: 'REFUGEE' },
      { label: 'Returnee', value: 'RETURNEE' },
      { label: 'IDP', value: 'IDP' },
    ];
  }

  get supportTypeOptions() {
    return [
      { label: 'Component 1 (Public Works)', value: 'Component 1 (Public Works)' },
      { label: 'Component 1 (Direct Income Support)', value: 'Component 1 (Direct Income Support)' },
    ];
  }

  get ageRangeOptions() {
    return [
      { label: 'Child (0-17)', value: '0-17' },
      { label: 'Youth (18-35)', value: '18-35' },
      { label: 'Middle Age (36-53)', value: '36-53' },
      { label: 'Old (54+)', value: '54-125' },
    ];
  }

  get grievanceCategoryOptions() {
    return [
      { label: 'Non-GBV', value: 'N' },
      { label: 'GBV', value: 'G' },
    ];
  }

  get wageRequestStatusOptions() {
    return [
      { label: 'Draft', value: 0 },
      { label: 'IP Approver Approved', value: 1 },
      { label: 'Initial Reviewer Approved', value: 2 },
      { label: 'Financial Approver Approved', value: 3 },
      { label: 'Final Payment Authorizer Approved', value: 4 },
      { label: 'Paid from API', value: 6 },
      { label: 'Rejected by Initial Reviewer', value: 100 },
      { label: 'Rejected by Financial Approver', value: 101 },
      { label: 'Rejected by Final Payment Authorizer', value: 102 },
      { label: 'Rejected by IP Approver', value: 105 },
    ];
  }

  get paidStatusOptions() {
    return [
      { label: 'Paid', value: 'Paid' },
      { label: 'Unpaid', value: 'Unpaid' },
    ];
  }

  get paymentCycleOptions() {
    return Array.from({ length: 15 }, (_, i) => ({
      label: `Payment Cycle ${i + 1}`,
      value: String(i + 1),
    }));
  }

  get indicatorTypeOptions() {
    return [
      { label: 'Project Development Objective Indicators by Objectives/Outcomes', value: 1 },
      { label: 'Monitoring & Evaluation Plan: Intermediate Results Indicators', value: 2 },
    ];
  }

  private readonly indicatorsByType: Record<number, any[]> = {
    1: [
      { label: 'Beneficiaries of social safety net programs', value: 1 },
      { label: 'Beneficiaries of social safety net programs - Female', value: 2 },
      { label: 'Beneficiary households of social safety net programs- Refugees', value: 3 },
      { label: 'Beneficiary households of social safety net programs- Host Communities', value: 4 },
      { label: 'Beneficiary households of social safety net programs- Female Refugees (Number)', value: 5 },
      { label: 'Beneficiary households of social safety net programs- Female Host Communities (Number)', value: 6 },
      { label: 'Beneficiary and non-beneficiary households reporting satisfaction with community assets created through LIPW (Outside MIS-Survey)', value: 7 },
      { label: 'Beneficiary households receiving economic opportunities', value: 8 },
      { label: 'Eligible beneficiary households with functional income-generating investments four months after the receipt of the full economic opportunities package', value: 9 },
      { label: 'Percentage of beneficiaries paid using the enhanced integrated biometric and Management Information Systems', value: 10 },
    ],
    2: [
      { label: 'Number of beneficiary households receiving cash for performing labor intensive public works', value: 11 },
      { label: 'Number of beneficiaries receiving cash for performing labor intensive public works who are female', value: 12 },
      { label: 'Number of beneficiary households participating in all sessions of the in-depth Cash Plus training', value: 13 },
      { label: 'Number of beneficiary households participating in all the sessions of the in-depth Cash Plus training - refugees number', value: 14 },
      { label: 'Number of beneficiary households participating in all the sessions of the in-depth Cash Plus training - host communities', value: 15 },
      { label: 'Number of beneficiary households receiving cash transfer for participating in the behavioral change communication training', value: 16 },
      { label: 'Number of beneficiary households receiving Direct Income Support', value: 17 },
      { label: 'Percentage of Labor Intensive Public Works subprojects that mitigate climate-induced shocks', value: 18 },
      { label: 'Number of LIPW work days created', value: 19 },
      { label: 'Number of beneficiaries receiving cash for performing labor intensive public works who are refugees or host communities', value: 20 },
      { label: 'Number of beneficiary households receiving Direct Income Support who have a female primary beneficiary (Number)', value: 21 },
      { label: 'Number of beneficiaries receiving economic opportunities who are youth', value: 22 },
      { label: 'Number of beneficiaries receiving Economic Opportunities who are female youth', value: 23 },
      { label: 'Percentage of grievances resolved through the GRM', value: 24 },
      { label: 'Percentage of cash transfers to beneficiary households made on time', value: 25 },
      { label: 'Increased participation by women in community level governance and coordination structures', value: 26 },
      { label: 'Capacity Building Plan for Safety Net is implemented by the Ministry of Gender, Child and Social Welfare', value: 27 },
    ],
  };

  getIndicatorsByType(type: number): any[] {
    return this.indicatorsByType[type] || [];
  }

  getIndicatorLabelByValue(value: number | string): string {
    const indicatorValue = Number(value);

    for (const indicators of Object.values(this.indicatorsByType)) {
      const match = indicators.find((indicator) => indicator.value === indicatorValue);
      if (match) {
        return match.label;
      }
    }

    return String(value ?? '--');
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
