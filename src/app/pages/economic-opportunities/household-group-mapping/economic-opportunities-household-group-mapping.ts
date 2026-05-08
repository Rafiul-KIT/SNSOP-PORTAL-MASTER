import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuItem, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { IdName, LookupService } from '../../../../services/lookup.service';
import { ApiService } from '../../../../services/api.service';

interface GroupRecord {
  id: number;
  groupName: string;
  latitude: number;
  longitude: number;
  vlsaFormed: boolean;
}

interface GroupListResponse {
  code?: number | string | null;
  message?: string | null;
  content?: GroupRecord[] | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  totalElements?: number | null;
}

@Component({
  selector: 'app-economic-opportunities-household-group-mapping',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbModule,
    ButtonModule,
    FloatLabel,
    Select,
    TableModule,
    CheckboxModule,
    Toast,
  ],
  providers: [MessageService],
  templateUrl: './economic-opportunities-household-group-mapping.html',
  styleUrl: './economic-opportunities-household-group-mapping.scss',
})
export class EconomicOpportunitiesHouseholdGroupMapping implements OnInit {
  private readonly groupEndpoint = '/api/econ-op/group/get';

  selectedState: string | number | null = null;
  selectedCounty: string | number | null = null;
  selectedPayam: string | number | null = null;
  selectedBoma: string | number | null = null;

  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];
  isLoadingStates = false;
  isLoadingCounties = false;
  isLoadingPayams = false;
  isLoadingBomas = false;
  isLoadingGroups = false;

  beneficiaries: any[] = [];
  selectedBeneficiaries: any[] = [];
  selectedGroup: number | null = null;
  showTable = false;

  groups: GroupRecord[] = [];

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Household And GroupId Mapping', icon: 'fas fa-users-cog' },
  ];

  constructor(
    private lookupService: LookupService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    this.loadStates();
    this.loadGroups();
  }

  async loadStates(): Promise<void> {
    this.isLoadingStates = true;
    try {
      this.states = await this.lookupService.getStateList();
    } catch (err) {
      console.error('Failed to load states', err);
    } finally {
      this.isLoadingStates = false;
    }
  }

  async onStateChange(): Promise<void> {
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.selectedCounty = null;
    this.selectedPayam = null;
    this.selectedBoma = null;
    if (!this.selectedState) return;
    this.isLoadingCounties = true;
    try {
      this.counties = await this.lookupService.getCountyListByStateId(this.selectedState);
    } catch (err) {
      console.error('Failed to load counties', err);
    } finally {
      this.isLoadingCounties = false;
    }
  }

  async onCountyChange(): Promise<void> {
    this.payams = [];
    this.bomas = [];
    this.selectedPayam = null;
    this.selectedBoma = null;
    if (!this.selectedCounty) return;
    this.isLoadingPayams = true;
    try {
      this.payams = await this.lookupService.getPayamListByCountyId(this.selectedCounty);
    } catch (err) {
      console.error('Failed to load payams', err);
    } finally {
      this.isLoadingPayams = false;
    }
  }

  async onPayamChange(): Promise<void> {
    this.bomas = [];
    this.selectedBoma = null;
    if (!this.selectedPayam) return;
    this.isLoadingBomas = true;
    try {
      this.bomas = await this.lookupService.getBomaListByPayamId(this.selectedPayam);
    } catch (err) {
      console.error('Failed to load bomas', err);
    } finally {
      this.isLoadingBomas = false;
    }
  }

  async loadGroups(): Promise<void> {
    this.isLoadingGroups = true;
    this.cdr.detectChanges();

    try {
      const res = await this.api.GET<GroupListResponse>(this.groupEndpoint, {
        pageNumber: 0,
        pageSize: 1000,
      });
      const data = res?.data;

      if (!this.isApiSuccess(data, Array.isArray(data?.content))) {
        throw new Error(data?.message || 'Unable to load groups');
      }

      const content = Array.isArray(data?.content) ? data.content : [];
      this.groups = content.map((item) => ({
        id: Number(item.id) || 0,
        groupName: item.groupName ?? '',
        latitude: Number(item.latitude) || 0,
        longitude: Number(item.longitude) || 0,
        vlsaFormed: !!item.vlsaFormed,
      }));
    } catch (err) {
      console.error('Failed to load groups', err);
      this.groups = [];
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load household groups.',
      });
    } finally {
      this.isLoadingGroups = false;
      this.cdr.detectChanges();
    }
  }

  onSearch(): void {
    if (!this.canSearch()) {
      this.msg.add({
        severity: 'warn',
        summary: 'Geo Fields Required',
        detail: 'Please select State, County, Payam, and Boma before searching.',
      });
      return;
    }

    // Mock data for beneficiaries
    this.beneficiaries = [
      { id: 1, name: 'Beneficiary 1', householdNo: 'HH-001', location: 'State A, County B' },
      { id: 2, name: 'Beneficiary 2', householdNo: 'HH-002', location: 'State A, County B' },
      { id: 3, name: 'Beneficiary 3', householdNo: 'HH-003', location: 'State A, County B' },
    ];
    this.showTable = true;
  }

  resetFilters(): void {
    this.selectedState = null;
    this.selectedCounty = null;
    this.selectedPayam = null;
    this.selectedBoma = null;
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.beneficiaries = [];
    this.selectedBeneficiaries = [];
    this.selectedGroup = null;
    this.showTable = false;
  }

  onAssign(): void {
    if (this.selectedBeneficiaries.length > 0 && this.selectedGroup) {
      console.log('Assigning', this.selectedBeneficiaries, 'to', this.selectedGroup);
      // Logic for assignment
    }
  }

  canSearch(): boolean {
    return !!this.selectedState && !!this.selectedCounty && !!this.selectedPayam && !!this.selectedBoma;
  }

  private isApiSuccess(data: { code?: number | string | null } | null | undefined, fallback = false): boolean {
    if (!data) return fallback;
    if (data.code === undefined || data.code === null || data.code === '') return fallback;
    const code = Number(data.code);
    return code === 0 || code === 200;
  }
}
