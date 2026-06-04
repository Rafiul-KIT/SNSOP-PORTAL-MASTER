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

  private allCountyList: IdName[] = [];
  private allPayamList: IdName[] = [];
  private allBomaList: IdName[] = [];

  private readonly GEO_SEARCH_URL = '/api/lookup/geo/search';
  private readonly MENU_FIND_ALL_URL = '/api/menus/findAll';

  constructor(private api: ApiService) {}

  // ---------- PUBLIC GEO LOOKUP METHODS ----------

  async getStateList(size = 200): Promise<IdName[]> {
    if (this.statesCache) return this.statesCache;
    this.statesCache = await this.geoSearch('STATE', null, size);
    return this.statesCache;
  }

  async getOrFetchStateList(): Promise<IdName[]> {
    return this.getStateList();
  }

  getStateNameById(stateId: string | number): string {
    const id = String(stateId);
    const found = this.statesCache?.find((s) => String(s.id) === id);
    return found ? found.name : '--';
  }

  async getCountyListByStateId(stateId: string | number, size = 500): Promise<IdName[]> {
    if (this.countiesByState.has(stateId)) return this.countiesByState.get(stateId)!;
    const list = await this.geoSearch('COUNTY', stateId, size);
    this.countiesByState.set(stateId, list);
    return list;
  }

  async fetchAllCountyList(): Promise<IdName[]> {
    if (this.allCountyList.length) return this.allCountyList;
    const list = await this.geoSearch('COUNTY', null, -1);
    this.allCountyList = list;
    return list;
  }

  getCountyNameById(countyId: string | number): string {
    const id = String(countyId);
    const found = this.allCountyList.find((c) => String(c.id) === id);
    if (found) return found.name;
    for (const counties of this.countiesByState.values()) {
      const foundState = counties.find((c) => String(c.id) === id);
      if (foundState) return foundState.name;
    }
    return '--';
  }

  async getPayamListByCountyId(countyId: string | number, size = 1000): Promise<IdName[]> {
    if (this.payamsByCounty.has(countyId)) return this.payamsByCounty.get(countyId)!;
    const list = await this.geoSearch('PAYAM', countyId, size);
    this.payamsByCounty.set(countyId, list);
    return list;
  }

  async fetchAllPayamList(): Promise<IdName[]> {
    if (this.allPayamList.length) return this.allPayamList;
    const list = await this.geoSearch('PAYAM', null, -1);
    this.allPayamList = list;
    return list;
  }

  getPayamNameById(payamId: string | number): string {
    const id = String(payamId);
    const found = this.allPayamList.find((p) => String(p.id) === id);
    if (found) return found.name;
    for (const payams of this.payamsByCounty.values()) {
      const foundPayam = payams.find((p) => String(p.id) === id);
      if (foundPayam) return foundPayam.name;
    }
    return '--';
  }

  async getBomaListByPayamId(payamId: string | number, size = 2000): Promise<IdName[]> {
    if (this.bomasByPayam.has(payamId)) return this.bomasByPayam.get(payamId)!;
    const list = await this.geoSearch('BOMA', payamId, size);
    this.bomasByPayam.set(payamId, list);
    return list;
  }

  async fetchAllBomaList(): Promise<IdName[]> {
    if (this.allBomaList.length) return this.allBomaList;
    const list = await this.geoSearch('BOMA', null, -1);
    this.allBomaList = list;
    return list;
  }

  getBomaNameById(bomaId: string | number): string {
    const id = String(bomaId);
    const found = this.allBomaList.find((b) => String(b.id) === id);
    if (found) return found.name;
    for (const bomas of this.bomasByPayam.values()) {
      const foundBoma = bomas.find((b) => String(b.id) === id);
      if (foundBoma) return foundBoma.name;
    }
    return '--';
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

// ===================== 📊 BENEFICIARY ENUMS ===================== //

  private readonly RelationshipEnum = [
    { id: 1, value: 'HOUSEHOLD_HEAD', label: 'Household Head' },
    { id: 2, value: 'SPOUSE', label: 'Spouse' },
    { id: 3, value: 'SON_DAUGHTER', label: 'Son/Daughter' },
    { id: 4, value: 'SON_DAUGHTER_IN_LAW', label: 'Son/daughter in law' },
    { id: 5, value: 'GRANDCHILD', label: 'Grandchild' },
    { id: 6, value: 'PARENT', label: 'Parent' },
    { id: 7, value: 'PARENT_IN_LAW', label: 'Parent-in-law' },
    { id: 8, value: 'SIBLING_IN_LAW', label: 'Sibling-in-law' },
    { id: 9, value: 'SIBLING', label: 'Sibling' },
    { id: 10, value: 'OTHER', label: 'Other' },
    { id: 11, value: 'DOMESTIC_WORKER', label: 'Domestic Worker' },
    { id: 12, value: 'NO_RELATION', label: 'No Relation' },
  ];

  getRelationshipEnum = () => {
    return this.RelationshipEnum;
  };

  getRelationshipEnumByValue = (value: any) => {
    const dataFound = this.RelationshipEnum.find(
      (sce: any) => sce.value == value
    );
    return dataFound ? dataFound.label : '--';
  };

  private readonly DocumentTypeEnum = [
    { id: 0, value: 'PASSPORT', label: 'Passport' },
    { id: 1, value: 'NATIONAL_ID', label: 'National Id' },
    { id: 2, value: 'OTHER', label: 'Other' },
    { id: 3, value: 'REFUGEE_RATION_CARD', label: 'Refugee Ration Card' },
    { id: 4, value: 'REFUGEE_ID_CARD', label: 'Refugee Id Card' },
    { id: 5, value: 'REFUGEE_PROOF_OF_REGISTRATION', label: 'Refugee Proof of Registration' },
    { id: 6, value: 'NONE', label: 'None' },
  ];

  getDocumentTypeEnum = () => {
    return this.DocumentTypeEnum;
  };

  getDocumentTypeEnumByValue = (value: any) => {
    const dataFound = this.DocumentTypeEnum.find(
      (sce: any) => sce.value == value
    );
    return dataFound ? dataFound.label : '--';
  };

  private readonly IncomeSourceEnum = [
    { id: 1, value: 'NONE', label: 'None' },
    { id: 2, value: 'SELLING_OF_FARM', label: 'Selling of farm' },
    { id: 3, value: 'SELLING_OF_NON_FARM', label: 'Selling of non farm' },
    { id: 4, value: 'CAUSAL_LABOUR', label: 'Causal labour' },
    { id: 5, value: 'FORMAL_EMPLOYMENT', label: 'Formal employment' },
    { id: 6, value: 'REMITTANCES', label: 'Remittances' },
    { id: 7, value: 'GIFT', label: 'Gift' },
    { id: 8, value: 'FROM_GOVT', label: 'From govt' },
    { id: 9, value: 'FROM_NGO', label: 'From ngo' },
    { id: 10, value: 'PENSION', label: 'Pension' },
    { id: 11, value: 'OTHER', label: 'Other' },
  ];

  getIncomeSourceEnum = () => {
    return this.IncomeSourceEnum;
  };

  getIncomeSourceEnumByValue = (value: any) => {
    const dataFound = this.IncomeSourceEnum.find(
      (item: any) => item.value == value
    );
    return dataFound ? dataFound.label : '--';
  };

  private readonly SelectionReasonEnum = [
    { id: 1, value: 'LIPW_REASON_1', label: 'Poor household with no sufficient income to sustain the household' },
    { id: 2, value: 'LIPW_REASON_2', label: 'Household contain able bodied youth member (18-35)' },
    { id: 3, value: 'LIPW_REASON_3', label: 'Household headed by young men and women between the ages of 18 and 35' },
    { id: 4, value: 'LIPW_REASON_4', label: 'Many members who are dependents (HH with dependants greater than 3)' },
    { id: 5, value: 'LIPW_REASON_5', label: 'Poor household which have persons with severe disabilities' },
    { id: 6, value: 'DIS_REASON_1', label: 'Child headed households with no alternate income support' },
    { id: 7, value: 'DIS_REASON_2', label: 'Elderly headed household lacking alternate income support and able bodied member' },
    { id: 8, value: 'DIS_REASON_3', label: 'Persons with disability headed household lacking alternate income support and able bodied member' },
    { id: 9, value: 'DIS_REASON_4', label: 'Chronically ill headed household lacking alternate income and able bodied member' },
    { id: 10, value: 'DIS_REASON_5', label: 'Female headed household lacking alternate income support and able-bodied member' },
  ];

  getSelectionReasonEnum = () => {
    return this.SelectionReasonEnum;
  };

  getSelectionReasonEnumByValue = (value: any) => {
    const dataFound = this.SelectionReasonEnum.find(
      (sce: any) => sce.value == value
    );
    return dataFound ? dataFound.label : '--';
  };

  private readonly SelectionCriteriaEnum = [
    { id: 0, value: 'LIPW', name: 'Public Works' },
    { id: 1, value: 'DIS', name: 'Direct Income Support' },
  ];

  getSelectionCriteriaEnum = () => {
    return this.SelectionCriteriaEnum;
  };

  getSelectionCriteriaEnumByValue = (value: any) => {
    const dataFound = this.SelectionCriteriaEnum.find(
      (sce: any) => sce.value == value
    );
    return dataFound ? dataFound.name : '--';
  };

  private readonly GenderEnum = [
    { id: 0, value: 'MALE', label: 'Male' },
    { id: 1, value: 'FEMALE', label: 'Female' },
  ];

  getGenderEnum = () => {
    return this.GenderEnum;
  };

  getGenderEnumByValue = (value: any) => {
    const dataFound = this.GenderEnum.find((sce: any) => sce.value == value);
    return dataFound ? dataFound.label : '--';
  };

  private readonly MaritalStatusEnum = [
    { id: 0, value: 'SINGLE', label: 'Single' },
    { id: 1, value: 'MARRIED', label: 'Married' },
    { id: 2, value: 'WIDOW', label: 'Widow' },
    { id: 3, value: 'SEPARATED', label: 'Separated' },
    { id: 4, value: 'DIVORCE', label: 'Divorce' },
  ];

  getMaritalStatusEnum = () => {
    return this.MaritalStatusEnum;
  };

  getMaritalStatusEnumByValue = (value: any) => {
    const dataFound = this.MaritalStatusEnum.find(
      (sce: any) => sce.value == value
    );
    return dataFound ? dataFound.label : '--';
  };

  private readonly LegalStatusEnum = [
    { id: 0, value: 'HOST', label: 'Host' },
    { id: 1, value: 'RETURNEE', label: 'Returnee' },
    { id: 2, value: 'REFUGEE', label: 'Refugee' },
    { id: 3, value: 'IDP', label: 'IDP' },
  ];

  getLegalStatusEnum = () => {
    return this.LegalStatusEnum;
  };

  getLegalStatusEnumByValue = (value: any) => {
    const dataFound = this.LegalStatusEnum.find(
      (sce: any) => sce.value == value
    );
    return dataFound ? dataFound.label : '--';
  };

  private readonly RegistrationPhaseEnum = [
    { id: 0, value: 'PARENT', label: 'PP (Parent Project)' },
    { id: 1, value: 'AF', label: 'AF (Additional Financing)' },
    { id: 2, value: 'RP', label: 'RP' },
  ];

  getRegistrationPhaseEnum = () => {
    return this.RegistrationPhaseEnum;
  };

  getRegistrationPhaseEnumByValue = (value: any) => {
    const dataFound = this.RegistrationPhaseEnum.find(
      (sce: any) => sce.value == value
    );
    return dataFound ? dataFound.label : '--';
  };

  private readonly OccupationEnum = [
    { id: 1, value: 'FORMAL_JOB', label: 'Formal Job' },
    { id: 2, value: 'CASUAL_WORK', label: 'Casual Work' },
    { id: 3, value: 'SELF_EMPLOYED', label: 'Self Employed' },
    { id: 4, value: 'AGRICULTURAL_WORK', label: 'Agricultural Work' },
    { id: 5, value: 'HOMEMAKER', label: 'Homemaker' },
    { id: 6, value: 'UNEMPLOYED', label: 'Unemployed' },
    { id: 7, value: 'STUDENT', label: 'Student' },
    { id: 8, value: 'DISABLED', label: 'Disabled' },
    { id: 9, value: 'RETIRED', label: 'Retired' },
    { id: 10, value: 'OTHER', label: 'Other' },
  ];

  getOccupationEnum = () => {
    return this.OccupationEnum;
  };

  getOccupationEnumByValue = (value: any) => {
    const dataFound = this.OccupationEnum.find(
      (sce: any) => sce.value == value
    );
    return dataFound ? dataFound.label : '--';
  };

  private readonly CurrencyEnum = [
    { id: 0, value: 'SUDANESE_POUND', label: 'SDG' },
    { id: 1, value: 'USD', label: 'USD' },
    { id: 2, value: 'POUND', label: 'POUND' },
    { id: 3, value: 'EURO', label: 'EURO' },
  ];

  getCurrencyEnum = () => {
    return this.CurrencyEnum;
  };

  getCurrencyEnumByValue = (value: any) => {
    const dataFound = this.CurrencyEnum.find((sce: any) => sce.value == value);
    return dataFound ? dataFound.label : '--';
  };
}
