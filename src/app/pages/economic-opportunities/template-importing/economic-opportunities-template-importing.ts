import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { MenuItem } from 'primeng/api';
import { Select } from 'primeng/select';
import { IdName, LookupService } from '../../../../services/lookup.service';

@Component({
  selector: 'app-economic-opportunities-template-importing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbModule,
    ButtonModule,
    FloatLabel,
    Select,
  ],
  templateUrl: './economic-opportunities-template-importing.html',
  styleUrl: './economic-opportunities-template-importing.scss',
})
export class EconomicOpportunitiesTemplateImporting implements OnInit {
  selectedTemplate: string | null = null;
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

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Excel Template Download', icon: 'fas fa-file-download' },
  ];

  templateOptions = [
    { label: 'Household Group View Template', value: 'Household Group View Template' },
    { label: 'Beneficiary Randomization Enrollment Template', value: 'Beneficiary Randomization Enrollment Template' },
    { label: 'Course Entity Template', value: 'Course Entity Template' },
    { label: 'Course Details Template', value: 'Course Details Template' },
    { label: 'Training Attendance Tracking Template', value: 'Training Attendance Tracking Template' },
    { label: 'Business Plan Development Template', value: 'Business Plan Development Template' },
    { label: 'Coaching Entity Template', value: 'Coaching Entity Template' },
    { label: 'Coaching Details Template', value: 'Coaching Details Template' },
    { label: 'Coaching Session tracking Template', value: 'Coaching Session tracking Template' },
    { label: 'Livelihood Grant Disbursement Template', value: 'Livelihood Grant Disbursement Template' },
    { label: 'Financial Service Linkage Tracking Template', value: 'Financial Service Linkage Tracking Template' },
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

    if (!this.selectedState) {
      return;
    }

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

    if (!this.selectedCounty) {
      return;
    }

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

    if (!this.selectedPayam) {
      return;
    }

    this.isLoadingBomas = true;

    try {
      this.bomas = await this.lookupService.getBomaListByPayamId(this.selectedPayam);
    } catch (err) {
      console.error('Failed to load bomas', err);
    } finally {
      this.isLoadingBomas = false;
    }
  }

  resetFilters(): void {
    this.selectedTemplate = null;
    this.selectedState = null;
    this.selectedCounty = null;
    this.selectedPayam = null;
    this.selectedBoma = null;
    this.counties = [];
    this.payams = [];
    this.bomas = [];
  }
}
