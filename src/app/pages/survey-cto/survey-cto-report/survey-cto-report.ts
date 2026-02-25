import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { Loader } from '../../../components/loader/loader';
import { LookupService } from '../../../../services/lookup.service';
import { ApiService } from '../../../../services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-survey-cto-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    SelectModule,
    FloatLabelModule,
    ButtonModule,
    Loader,
    InputTextModule,
    ProgressBarModule,
    TableModule,
  ],
  templateUrl: './survey-cto-report.html',
  styleUrl: './survey-cto-report.scss'
})
export class SurveyCtoReport implements OnInit {
  isLoading = false;
  isTableLoading = false;
  breadcrumbItems: MenuItem[] = [];
  breadcrumbHome: MenuItem = { icon: 'fas fa-home', routerLink: '/' };
  searchForm: FormGroup;
  states: any[] = [];
  counties: any[] = [];
  payams: any[] = [];
  bomas: any[] = [];
  supportTypes: any[] = [];
  registrationPhases: any[] = [];
  surveyData: any[] = [];
  cols: any[] = [];
  totalRecords = 0;
  rowsPerPage = 10;
  first = 0;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private lookupService: LookupService,
    private apiService: ApiService
  ) {
    this.searchForm = this.fb.group({
      state: [null, Validators.required],
      county: [null, Validators.required],
      payam: [null, Validators.required],
      boma: [null, Validators.required],
      supportType: [null],
      registrationPhase: [null],
    });
  }

  ngOnInit(): void {
    this.breadcrumbItems = [
      { label: 'Survey CTO Report' }
    ];

    this.supportTypes = [
      { name: 'ALL', value: 'ALL' },
      { name: 'LIPW', value: 'LIPW' },
      { name: 'DIS', value: 'DIS' },
    ];

    this.registrationPhases = [
      { name: 'ALL', value: 'ALL' },
      { name: 'AF(Additional Financing)', value: 'AF' },
      { name: 'PP(Parent Project)', value: 'PARENT' },
    ];

    const baseCols = [
      { field: 'duration', header: 'Duration' },
      { field: 'pre_payam', header: 'Pre Payam' },
      { field: 'pre_boma', header: 'Pre Boma' },
      { field: 'householdnumber', header: 'HH Number' },
      { field: 'rev_hh_size_0_5', header: 'HH 0-5' },
      { field: 'rev_hh_size_6_17', header: 'HH 6-17' },
      { field: 'rev_hh_size_18_35', header: 'HH 18-35' },
      { field: 'rev_hh_size_36_64', header: 'HH 36-64' },
      { field: 'rev_hh_size_65', header: 'HH 65+' },
      { field: 'hh_size', header: 'HH Size' },
      { field: 'rev_res_first_name', header: 'Resp First Name' },
      { field: 'rev_res_last_name', header: 'Resp Last Name' },
      { field: 'rev_res_nick_name', header: 'Resp Nick Name' },
      { field: 'rev_res_relat_hh_head', header: 'Resp Rel Head' },
      { field: 'rev_res_age', header: 'Resp Age' },
      { field: 'rev_res_gender', header: 'Resp Gender' },
      { field: 'rev_res_marital_status', header: 'Resp Marital' },
      { field: 'rev_res_read_write', header: 'Resp Read/Write' },
      { field: 'rev_res_occupation', header: 'Resp Occup' },
      { field: 'respondent_name', header: 'Respondent Name' },
      { field: 'eligible_respondent', header: 'Eligible Resp' },
      { field: 'hh_roster_count', header: 'HH Roster Count' },
    ];

    const memberCols: any[] = [];
    for (let i = 1; i <= 10; i++) {
      memberCols.push(
        { field: `hh_member_number_${i}`, header: `M${i} #` },
        { field: `rev_hr_first_name_${i}`, header: `M${i} First Name` },
        { field: `rev_hr_last_name_${i}`, header: `M${i} Last Name` },
        { field: `rev_hr_nick_name_${i}`, header: `M${i} Nick Name` },
        { field: `rev_hr_relat_hh_head_${i}`, header: `M${i} Rel Head` },
        { field: `rev_hr_age_${i}`, header: `M${i} Age` },
        { field: `rev_hr_gender_${i}`, header: `M${i} Gender` },
        { field: `rev_hr_marital_status_${i}`, header: `M${i} Marital` },
        { field: `rev_hr_read_write_${i}`, header: `M${i} Read/Write` },
        { field: `rev_hr_occupation_${i}`, header: `M${i} Occupation` },
        { field: `member_name_${i}`, header: `M${i} Full Name` },
        { field: `eligible_member_${i}`, header: `M${i} Eligible` }
      );
    }

    const eligibilityCols: any[] = [
      { field: 'hh_roster_index', header: 'HH Roster Index' },
      { field: 'number_eligible', header: 'Number Eligible' },
    ];
    for (let i = 0; i <= 10; i++) {
      eligibilityCols.push(
        { field: `member_${i}`, header: `Member ${i}` },
        { field: `member${i}_eligibility`, header: `M${i} Eligiblity` },
        { field: `gender_m${i}`, header: `M${i} Gender (Elig)` }
      );
    }

    const participationCols = [
      { field: 'count_hh_female', header: 'Count HH Female' },
      { field: 'count_hh_male', header: 'Count HH Male' },
      { field: 'rev_want_to_participate', header: 'Want to Participate' },
      { field: 'why_not', header: 'Why Not' },
      { field: 'why_not_other', header: 'Why Not Other' },
    ];

    const nominationCols: any[] = [];
    for (let i = 1; i <= 10; i++) {
      nominationCols.push(
        { field: `nomination${i}`, header: `Nomination ${i}` },
        { field: `nominee_name${i}`, header: `Nominee ${i} Name` },
        { field: `gender_n${i}`, header: `Nominee ${i} Gender` },
        { field: `rev_nominate_again${i}`, header: `Nominate ${i} Again` }
      );
    }

    const preNomineeCols: any[] = [
      { field: 'count_n_female', header: 'Count N Female' },
      { field: 'count_n_male', header: 'Count N Male' },
      { field: 'male_only', header: 'Male Only' },
      { field: 'female_only', header: 'Female Only' },
      { field: 'has_male', header: 'Has Male' },
      { field: 'has_female', header: 'Has Female' },
      { field: 'nudge1_yes', header: 'Nudge 1 Yes' },
      { field: 'pre_nominee', header: 'Pre Nominee' },
    ];

    for (let i = 1; i <= 5; i++) {
      preNomineeCols.push(
        { field: `pre_nom_name_${i}`, header: `Pre Nom ${i} Name` },
        { field: `pre_nom_gender_${i}`, header: `Pre Nom ${i} Gender` },
        { field: `pre_nom_age_${i}`, header: `Pre Nom ${i} Age` },
        { field: `pre_nom_confirm${i}`, header: `Pre Nom ${i} Confirm` },
        { field: `pre_nom_wn${i}_1`, header: `Pre Nom ${i} WN1` },
        { field: `pre_nom_wn${i}_3`, header: `Pre Nom ${i} WN3` },
        { field: `pre_nom_oth${i}`, header: `Pre Nom ${i} Other` }
      );
    }

    const finalCols = [
      { field: 'pre_gender_n_f', header: 'Pre Gender N F' },
      { field: 'pre_gender_n_m', header: 'Pre Gender N M' },
      { field: 'pre_only_f', header: 'Pre Only F' },
      { field: 'pre_only_m', header: 'Pre Only M' },
      { field: 'nudge2_yes', header: 'Nudge 2 Yes' },
      { field: 'main_gender', header: 'Main Gender' },
      { field: 'other_gender', header: 'Other Gender' },
      { field: 'nudge2_select', header: 'Nudge 2 Select' },
      { field: 'enumer_comment', header: 'Enumer Comment' },
      { field: 'submissiondate', header: 'Submission Date' },
      { field: 'starttime', header: 'Start Time' },
      { field: 'endtime', header: 'End Time' },
    ];

    this.cols = [
      { field: 'slNo', header: 'Sl No.' },
      ...baseCols,
      ...memberCols,
      ...eligibilityCols,
      ...participationCols,
      ...nominationCols,
      ...preNomineeCols,
      ...finalCols
    ];

    this.searchForm.get('county')?.disable();
    this.searchForm.get('payam')?.disable();
    this.searchForm.get('boma')?.disable();

    this.isLoading = true;
    this.cdr.detectChanges();

    this.lookupService.getStateList().then(states => {
      this.states = states;
      this.isLoading = false;
      this.cdr.detectChanges();
    }).catch(error => {
      console.error('Error fetching states:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load states.' });
      this.isLoading = false;
      this.cdr.detectChanges();
    });

    // Reset results when any form value changes
    this.searchForm.valueChanges.subscribe(() => {
      if (this.surveyData.length > 0 || this.totalRecords > 0) {
        this.surveyData = [];
        this.totalRecords = 0;
        this.cdr.detectChanges();
      }
    });
  }

  async onStateChange(event: { value: { id: number, name: string } }): Promise<void> {
    this.searchForm.get('county')?.reset();
    this.searchForm.get('payam')?.reset();
    this.searchForm.get('boma')?.reset();
    this.surveyData = [];
    this.totalRecords = 0;
    if (event.value) {
      this.searchForm.get('county')?.enable();
      this.cdr.detectChanges();
      try {
        const counties = await this.lookupService.getCountyListByStateId(event.value.id);
        this.counties = counties;
      } catch (error) {
        console.error('Error fetching counties:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load counties.' });
      } finally {
        this.cdr.detectChanges();
      }
    } else {
      this.searchForm.get('county')?.disable();
      this.searchForm.get('payam')?.disable();
      this.searchForm.get('boma')?.disable();
      this.counties = [];
      this.payams = [];
      this.bomas = [];
      this.cdr.detectChanges();
    }
  }

  async onCountyChange(event: { value: { id: number, name: string } }): Promise<void> {
    this.searchForm.get('payam')?.reset();
    this.searchForm.get('boma')?.reset();
    this.surveyData = [];
    this.totalRecords = 0;
    if (event.value) {
      this.searchForm.get('payam')?.enable();
      this.cdr.detectChanges();
      try {
        const payams = await this.lookupService.getPayamListByCountyId(event.value.id);
        this.payams = payams;
      } catch (error) {
        console.error('Error fetching payams:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load payams.' });
      } finally {
        this.cdr.detectChanges();
      }
    } else {
      this.searchForm.get('payam')?.disable();
      this.searchForm.get('boma')?.disable();
      this.payams = [];
      this.bomas = [];
      this.cdr.detectChanges();
    }
  }

  async onPayamChange(event: { value: { id: number, name: string } }): Promise<void> {
    this.searchForm.get('boma')?.reset();
    this.surveyData = [];
    this.totalRecords = 0;
    if (event.value) {
      this.searchForm.get('boma')?.enable();
      this.cdr.detectChanges();
      try {
        const bomas = await this.lookupService.getBomaListByPayamId(event.value.id);
        this.bomas = bomas;
      } catch (error) {
        console.error('Error fetching bomas:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load bomas.' });
      } finally {
        this.cdr.detectChanges();
      }
    } else {
      this.searchForm.get('boma')?.disable();
      this.bomas = [];
      this.cdr.detectChanges();
    }
  }

  resetForm(): void {
    this.searchForm.reset();
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.searchForm.get('county')?.disable();
    this.searchForm.get('payam')?.disable();
    this.searchForm.get('boma')?.disable();
    this.searchForm.patchValue({
      supportType: this.supportTypes[0]?.value || 'ALL',
      registrationPhase: this.registrationPhases[0]?.value || 'ALL'
    });
    this.surveyData = [];
    this.totalRecords = 0;
    this.cdr.detectChanges();
    Swal.fire({ icon: 'success', title: 'Success', text: 'Form has been reset' });
  }

  fetchSavedData(): void {
    if (this.searchForm.invalid) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please select State, County, Payam and Boma.' });
      return;
    }

    const formValues = this.searchForm.value;
    const pageIndex = Math.floor(this.first / this.rowsPerPage);
    const requestBody = {
      page: pageIndex,
      size: this.rowsPerPage,
      stateId: formValues.state?.id || 0,
      countyId: formValues.county?.id || 0,
      payamId: formValues.payam?.id || 0,
      bomaId: formValues.boma?.id || 0,
      registrationPhase: formValues.registrationPhase === 'ALL' ? null : formValues.registrationPhase,
      support_type: formValues.supportType === 'ALL' ? null : formValues.supportType
    };

    this.isTableLoading = true;
    this.cdr.detectChanges();

    this.apiService.POST('api/surveycto/revisiting/get-saved-data', requestBody)
      .then(response => {
        this.surveyData = response.data.records || [];
        this.totalRecords = response.data.total || 0;
        
        if (this.surveyData.length === 0) {
          Swal.fire({ icon: 'info', title: 'No Data', text: 'No records found for the selected criteria.' });
        }
      })
      .catch(error => {
        console.error('Error fetching survey data:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch survey data.' });
      })
      .finally(() => {
        this.isTableLoading = false;
        this.cdr.detectChanges();
      });
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rowsPerPage = event.rows;
    this.fetchSavedData();
  }

  downloadLatestSaved(): void {
    if (this.searchForm.invalid) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please select State, County, Payam and Boma.' });
      return;
    }
    const formValues = this.searchForm.value;
    const requestBody = {
      page: 0,
      size: 0,
      stateId: formValues.state?.id || 0,
      countyId: formValues.county?.id || 0,
      payamId: formValues.payam?.id || 0,
      bomaId: formValues.boma?.id || 0,
      registrationPhase: formValues.registrationPhase === 'ALL' ? null : formValues.registrationPhase,
      support_type: formValues.supportType === 'ALL' ? null : formValues.supportType
    };

    Swal.fire({
      title: 'Downloading in progress',
      html: '<div class="progress" style="margin-top: 20px;"><div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div></div>',
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    const config = {
      responseType: 'blob' as 'blob',
    };

    this.apiService.POST('api/surveycto/revisiting/download-latest-saved', requestBody, 'global', config)
      .then((response: any) => {
        Swal.close();
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'latest-saved-data.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Download complete.',
        });
      })
      .catch((err) => {
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Download failed. Error: ${err.message}`,
        });
      });
  }
}
