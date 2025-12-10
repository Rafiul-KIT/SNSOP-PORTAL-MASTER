

import { Component, ChangeDetectorRef, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TableModule } from 'primeng/table';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SplitButtonModule } from 'primeng/splitbutton';
import { Loader } from '../../../components/loader/loader';
import { LookupService } from '../../../../services/lookup.service';
import { ApiService } from '../../../../services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-survey-cto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    SelectModule,
    FloatLabelModule,
    TableModule,
    PaginatorModule,
    ButtonModule,
    Loader,
    InputTextModule,
    SplitButtonModule,
  ],
  templateUrl: './survey-cto.html',
  styleUrl: './survey-cto.scss',
})
export class SurveyCto implements OnInit {
  @ViewChild('csvUploader') csvUploader!: ElementRef<HTMLInputElement>;
  isLoading = false;
  showAdvancedSearch = false;
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
  totalRecords = 0;
  pageSize = 10;
  currentPage = 0;
  exportItems: MenuItem[] = [];
  exportLabel = 'Export as CSV';
  exportFormat = 'csv';
  selectedFile: File | null = null;
  isFilteredSearch = false;

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
      householdNumber: [null],
      name: [null],
      mobileNumber: [null],
      walletNumber: [null],
      supportType: [null],
      registrationPhase: [null],
    });
  }

  ngOnInit(): void {
    this.breadcrumbItems = [
      { label: 'Survey CTO' }
    ];

    this.exportItems = [

      {
        label: 'Export as CSV',
        icon: 'pi pi-file',
        command: () => {
          this.exportLabel = 'Export as CSV';
          this.exportFormat = 'csv';
          this.exportAs(this.exportFormat);
        }
      },
      {
        label: 'Export as Excel',
        icon: 'pi pi-file-excel',
        command: () => {
          this.exportLabel = 'Export as Excel';
          this.exportFormat = 'excel';
          this.exportAs(this.exportFormat);
        }
      }
    ];

    this.supportTypes = [
      { name: 'ALL' },
      { name: 'LIPW' },
      { name: 'DIS' },
    ];

    this.registrationPhases = [
      { name: 'ALL', value: 'ALL' },
      { name: 'AF(Additional Financing)', value: 'AF' },
      { name: 'PP(Parent Project)', value: 'PARENT' },
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
    this.performSearch();
  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  async onStateChange(event: { value: { id: number, name: string } }): Promise<void> {
    this.searchForm.get('county')?.reset();
    this.searchForm.get('payam')?.reset();
    this.searchForm.get('boma')?.reset();
  
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
    this.isFilteredSearch = false;
    this.searchForm.patchValue({
      supportType: this.supportTypes[0],
      registrationPhase: this.registrationPhases[0].value
    });
    this.cdr.detectChanges();
    Swal.fire({ icon: 'success', title: 'Success', text: 'Form has been reset' });
  }

  searchSurveyData(): void {
    this.isFilteredSearch = true;
    this.currentPage = 0;
    this.performSearch();
  }

  private performSearch(): void {
    if (this.isFilteredSearch && this.searchForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please select State, County, Payam, and Boma.',
      });
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    const formValues = this.searchForm.value;
    const requestBody: { [key: string]: any } = {
      page: this.currentPage,
      size: this.pageSize,
    };

    if (this.isFilteredSearch) {
      requestBody['stateId'] = formValues.state?.id;
      requestBody['countyId'] = formValues.county?.id;
      requestBody['payamId'] = formValues.payam?.id;
      requestBody['bomaId'] = formValues.boma?.id;
    }

    if (formValues.householdNumber) {
      requestBody['applicationId'] = formValues.householdNumber;
    }
    if (formValues.name) {
      requestBody['respondentName'] = formValues.name;
    }
    if (formValues.mobileNumber) {
      requestBody['mobileNumber'] = formValues.mobileNumber;
    }
    if (formValues.walletNumber) {
      requestBody['walletNumber'] = formValues.walletNumber;
    }
    if (formValues.supportType?.name) {
      requestBody['selectionCriteria'] = formValues.supportType.name;
    }
    if (formValues.registrationPhase) {
      requestBody['registrationPhase'] = formValues.registrationPhase;
    }

    this.apiService.POST('/api/surveycto/search', requestBody)
      .then(response => {
        if (response.data.operationResult) {
          this.totalRecords = response.data.total || 0;
          this.surveyData = (response.data.beneficiaries || []).map((beneficiary: any, index: number) => ({
            sl: this.currentPage * this.pageSize + index + 1,
            hhId: beneficiary.applicationId,
            beneficiaryName: [beneficiary.respondentFirstName, beneficiary.respondentMiddleName, beneficiary.respondentLastName].filter(Boolean).join(' '),
            age: beneficiary.respondentAge,
            gender: beneficiary.respondentGender,
            maritalStatus: beneficiary.maritalStatus,
            education: beneficiary.isReadWrite ? 'Literate' : 'Illiterate',
            numFamilyMembers: beneficiary.numberOfHouseholds,
            supportType: beneficiary.selectionCriteria,
            alternate: beneficiary.alternate ? [beneficiary.alternate.payeeFirstName, beneficiary.alternate.payeeMiddleName, beneficiary.alternate.payeeLastName].filter(Boolean).join(' ') : 'No',
            nominee: beneficiary.nominee ? [beneficiary.nominee.nomineeFirstName, beneficiary.nominee.nomineeMiddleName, beneficiary.nominee.nomineeLastName].filter(Boolean).join(' ') : 'No'
          }));
        } else {
          Swal.fire({ icon: 'error', title: 'Search Failed', text: response.data.errorMsg || 'An unknown error occurred.' });
          this.surveyData = [];
          this.totalRecords = 0;
        }
      })
      .catch(err => {
        Swal.fire({ icon: 'error', title: 'API Error', text: err.message || 'Failed to fetch survey data.' });
        this.surveyData = [];
        this.totalRecords = 0;
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  importData(): void {
    if (!this.selectedFile) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please select a file to import.' });
      return;
    }

    if (this.selectedFile.type !== 'text/csv' && !this.selectedFile.name.endsWith('.csv')) {
      Swal.fire({ icon: 'error', title: 'Invalid File Type', text: 'Only CSV files are allowed for import.' });
      this.clearSelectedFile();
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);

    Swal.fire({ icon: 'info', title: 'Importing', text: `${this.selectedFile.name} is being uploaded.` });
    this.apiService.POST('api/surveycto/revisiting/upload', formData, 'global', { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Upload Started',
          text: `${this.selectedFile?.name} has been imported successfully.`,
        });
        this.selectedFile = null;
        if (this.csvUploader) {
          this.csvUploader.nativeElement.value = ''; // Clear the input field
        }
        this.cdr.detectChanges(); // Update button disabled state and UI
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: `Could not import ${this.selectedFile?.name}. Error: ${err.message}`,
        });
        this.selectedFile = null;
        if (this.csvUploader) {
          this.csvUploader.nativeElement.value = ''; // Clear the input field
        }
        this.cdr.detectChanges(); // Update button disabled state and UI
      });
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    this.csvUploader.nativeElement.value = ''; // Clear the native file input
    this.cdr.detectChanges(); // Update button states and UI
    Swal.fire({ icon: 'info', title: 'File Cleared', text: 'Selected file has been removed.' });
  }

  onFileSelect(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const file = element.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        this.selectedFile = file;
      
      } else {
        Swal.fire({ icon: 'error', title: 'Invalid File Type', text: 'Only CSV files are allowed for import.' });
        this.selectedFile = null;
        if (this.csvUploader) {
          this.csvUploader.nativeElement.value = '';
        }
      }
    } else {
      this.selectedFile = null;
    }
    this.cdr.detectChanges(); // Update button disabled state
  }

  exportAs(format: string): void {
    if (format === 'csv') {
      if (this.searchForm.invalid) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please select State, County, Payam, and Boma for export.',
        });
        return;
      }
    
      const formValues = this.searchForm.value;
      const params: { [key: string]: any } = {
        stateId: formValues.state?.id,
        countyId: formValues.county?.id,
        payamId: formValues.payam?.id,
        bomaId: formValues.boma?.id,
        page: this.currentPage,
        size: -1,
      };

      // Add criteria if not 'ALL'
      if (formValues.supportType?.name !== 'ALL') {
        params['criteria'] = formValues.supportType?.name;
      }

      // Add registrationPhase if not 'ALL'
      if (formValues.registrationPhase && formValues.registrationPhase !== 'ALL') {
        params['registrationPhase'] = formValues.registrationPhase;
      }

      this.apiService.GET('/api/surveycto/revisiting/download-template', params, 'global', { responseType: 'blob' })
        .then((response: any) => {
          const blob = new Blob([response.data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'survey-cto-template.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'CSV export started.',
          });
        })
        .catch((err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `CSV export failed. Error: ${err.message}`,
          });
        });
    } else {
      const msg = `Exporting as ${format.toUpperCase()} is not available for now.`;
      console.log(msg);
      Swal.fire({
        icon: 'warning',
        title: 'Not Available',
        text: msg,
      });
    }
  }

  onPageChange(event: PaginatorState): void {
    this.currentPage = event.page ?? 0;
    this.pageSize = event.rows ?? 10;
    this.performSearch();
  }
}
