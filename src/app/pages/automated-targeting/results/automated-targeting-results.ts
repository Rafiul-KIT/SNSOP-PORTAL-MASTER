import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { LookupService, IdName } from '../../../../services/lookup.service';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../../services/api.service';
import { environment } from '../../../../environments/environment';

interface BeneficiaryVm {
  applicationId: string;
  nickName?: string;
  fullName: string;
  respondentGender: string;
  respondentAge: number;
  respondentPhoneNo: string;
  registrationPhase: string;
  selectionCriteria: string;
  stateName: string;
  countyName: string;
  payamName: string;
  bomaName: string;
}

@Component({
  selector: 'app-automated-targeting-results',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    PaginatorModule,
    TooltipModule,
    FloatLabelModule,
    Loader,
  ],
  providers: [LookupService],
  templateUrl: './automated-targeting-results.html',
})
export class AutomatedTargetingResults implements OnInit {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/automated-targeting/dashboard' };
  breadcrumbItems = [
    { label: 'Automated Targeting', icon: 'fas fa-arrows-down-to-people' },
    { label: 'Result List' },
  ];

  searchForm!: FormGroup;
  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];

  genderOptions = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
  ];

  registrationPhaseOptions = [
    { label: 'PARENT', value: 'PARENT' },
    { label: 'AF', value: 'AF' },
    { label: 'RP', value: 'RP' },
  ];

  criteriaOptions = [
    { label: 'LIPW', value: 'LIPW' },
    { label: 'DIS', value: 'DIS' },
  ];

  results: BeneficiaryVm[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;
  advanceSearchPanelVisible = false;
  isLoading = false;

  private readonly SEARCH_API_URL = `${environment.globalApi}api/beneficiary/search`;

  constructor(
    private fb: FormBuilder,
    @Inject(LookupService) private lookup: LookupService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private api: ApiService,
  ) {}

  async ngOnInit() {
    this.initForm();
    this.isLoading = true;
    await this.loadLookups();
    this.searchBeneficiaries();
  }

  initForm() {
    this.searchForm = this.fb.group({
      applicationId: [''],
      firstName: [''],
      middleName: [''],
      lastName: [''],
      nickName: [''],
      phoneNumber: [''],
      state: [null as IdName | null],
      county: [null as IdName | null],
      payam: [null as IdName | null],
      boma: [null as IdName | null],
      gender: [null as string | null],
      registrationPhase: [null as string | null],
      criteria: [null as string | null],
    });
  }

  async loadLookups() {
    await Promise.all([
      this.lookup.getOrFetchStateList(),
      this.lookup.fetchAllCountyList(),
      this.lookup.fetchAllPayamList(),
      this.lookup.fetchAllBomaList(),
    ]);

    this.states = await this.lookup.getStateList();
  }

  async onStateChange(state: IdName | null) {
    if (state?.id) {
      this.counties = await this.lookup.getCountyListByStateId(state.id);
    } else {
      this.counties = [];
    }
    this.payams = [];
    this.bomas = [];
    this.searchForm.patchValue({ county: null, payam: null, boma: null });
  }

  async onCountyChange(county: IdName | null) {
    if (county?.id) {
      this.payams = await this.lookup.getPayamListByCountyId(county.id);
    } else {
      this.payams = [];
    }
    this.bomas = [];
    this.searchForm.patchValue({ payam: null, boma: null });
  }

  async onPayamChange(payam: IdName | null) {
    if (payam?.id) {
      this.bomas = await this.lookup.getBomaListByPayamId(payam.id);
    } else {
      this.bomas = [];
    }
    this.searchForm.patchValue({ boma: null });
  }

  private buildCriteria(): any[] {
    const f = this.searchForm.value;
    const criteria: any[] = [];

    if (f.firstName)
      criteria.push({
        fieldName: 'RESPONDENT_FIRST_NAME',
        operator: 'LIKE',
        value: f.firstName.trim(),
      });
    if (f.middleName)
      criteria.push({
        fieldName: 'RESPONDENT_MIDDLE_NAME',
        operator: 'LIKE',
        value: f.middleName.trim(),
      });
    if (f.lastName)
      criteria.push({
        fieldName: 'RESPONDENT_LAST_NAME',
        operator: 'LIKE',
        value: f.lastName.trim(),
      });
    if (f.phoneNumber)
      criteria.push({
        fieldName: 'RESPONDENT_PHONE_NO',
        operator: 'LIKE',
        value: f.phoneNumber.trim(),
      });

    if (f.state?.id)
      criteria.push({
        fieldName: 'STATE_ID',
        operator: 'EQUAL',
        value: f.state.id,
      });
    if (f.county?.id)
      criteria.push({
        fieldName: 'COUNTY_ID',
        operator: 'EQUAL',
        value: f.county.id,
      });
    if (f.payam?.id)
      criteria.push({
        fieldName: 'PAYAM_ID',
        operator: 'EQUAL',
        value: f.payam.id,
      });
    if (f.boma?.id)
      criteria.push({
        fieldName: 'BOMA_ID',
        operator: 'EQUAL',
        value: f.boma.id,
      });
    if (f.gender)
      criteria.push({
        fieldName: 'RESPONDENT_GENDER',
        operator: 'EQUAL',
        value: f.gender,
      });
    if (f.criteria)
      criteria.push({
        fieldName: 'SELECTION_CRITERIA',
        operator: 'LIKE',
        value: f.criteria,
      });

    return criteria;
  }

  private buildSearchBody(page: number, size: number) {
    const f = this.searchForm.value;
    return {
      applicationId: f.applicationId ? f.applicationId.trim() : null,
      respondentFirstName: f.firstName ? f.firstName.trim() : null,
      respondentMiddleName: f.middleName ? f.middleName.trim() : null,
      respondentLastName: f.lastName ? f.lastName.trim() : null,
      respondentId: null,
      registrationPhase: f.registrationPhase || null,
      respondentGender: f.gender || null,
      selectionCriteria: f.criteria || null,
      criteria: this.buildCriteria(),
      sortColumn: 'ID',
      sortOrder: 'DESC',
      page,
      size,
    };
  }

  private toVm(list: any[]): BeneficiaryVm[] {
    return list.map((b) => {
      const fullName = [
        b.respondentFirstName,
        b.respondentMiddleName,
        b.respondentLastName,
      ]
        .filter(Boolean)
        .join(' ');

      return {
        applicationId: b.applicationId,
        nickName: b.nickName,
        fullName,
        respondentGender: b.respondentGender,
        respondentAge: b.respondentAge,
        respondentPhoneNo: b.respondentPhoneNo,
        registrationPhase: b.registrationPhase,
        selectionCriteria: b.selectionCriteria,
        stateName: b.address?.stateId
          ? this.lookup.getStateNameById(b.address.stateId) || String(b.address.stateId)
          : '',
        countyName: b.address?.countyId
          ? this.lookup.getCountyNameById(b.address.countyId) || String(b.address.countyId)
          : '',
        payamName: b.address?.payam
          ? this.lookup.getPayamNameById(b.address.payam) || String(b.address.payam)
          : '',
        bomaName: b.address?.boma
          ? this.lookup.getBomaNameById(b.address.boma) || String(b.address.boma)
          : '',
      };
    });
  }

  async fetchPage(page: number, size: number) {
    this.isLoading = true;
    const body = this.buildSearchBody(page, size);

    try {
      const res: any = await this.api.POST(this.SEARCH_API_URL, body, 'global');
      const data = res?.data;

      if (!data) {
        throw new Error('Empty response from beneficiary search');
      }

      const raw = data.beneficiaries || [];
      this.results = this.toVm(raw);
      this.totalRecords = Number(data.total || 0);
    } catch (error) {
      console.error('Beneficiary search failed:', error);
      this.results = [];
      this.totalRecords = 0;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  searchBeneficiaries() {
    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  resetForm() {
    this.searchForm.reset();
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  trackByAppId(_: number, row: BeneficiaryVm) {
    return row.applicationId;
  }

  viewBeneficiaryDetails(item: BeneficiaryVm) {
    this.router.navigate(['/automated-targeting/beneficiary-details/', item.applicationId]);
  }
}
