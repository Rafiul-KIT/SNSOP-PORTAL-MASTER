import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuItem } from 'primeng/api';
import { IdName, LookupService } from '../../../../services/lookup.service';

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
  ],
  templateUrl: './economic-opportunities-household-group-mapping.html',
  styleUrl: './economic-opportunities-household-group-mapping.scss',
})
export class EconomicOpportunitiesHouseholdGroupMapping implements OnInit {
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

  beneficiaries: any[] = [];
  selectedBeneficiaries: any[] = [];
  selectedGroup: any = null;
  showTable = false;

  groups = [
    { label: 'Group A', value: 'group_a' },
    { label: 'Group B', value: 'group_b' },
    { label: 'Group C', value: 'group_c' },
  ];

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Household And GroupId Mapping', icon: 'fas fa-users-cog' },
  ];

  constructor(private lookupService: LookupService) {}

  ngOnInit(): void {
    this.loadStates();
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

  onSearch(): void {
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
    this.showTable = false;
  }

  onAssign(): void {
    if (this.selectedBeneficiaries.length > 0 && this.selectedGroup) {
      console.log('Assigning', this.selectedBeneficiaries, 'to', this.selectedGroup);
      // Logic for assignment
    }
  }
}
