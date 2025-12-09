import { Component, ChangeDetectorRef, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TableModule } from 'primeng/table';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SplitButtonModule } from 'primeng/splitbutton';
import { InputGroupModule } from 'primeng/inputgroup';
import { Loader } from '../../../components/loader/loader';
import { LookupService } from '../../../../services/lookup.service';






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
    ToastModule,
    ButtonModule,
    Loader,
    InputTextModule,
    SplitButtonModule,
    HttpClientModule,
  ],
  templateUrl: './survey-cto.html',
  styleUrl: './survey-cto.scss',
  providers: [MessageService]
})
export class SurveyCto implements OnInit {
  @ViewChild('csvUploader') csvUploader!: ElementRef<HTMLInputElement>;
  isLoading = false;
  showAdvancedSearch = false;
  breadcrumbItems: MenuItem[] = [];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };
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

  constructor(private fb: FormBuilder, private messageService: MessageService, private http: HttpClient, private cdr: ChangeDetectorRef, private lookupService: LookupService) {
    this.searchForm = this.fb.group({
      state: [null],
      county: [null],
      payam: [null],
      boma: [null],
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
      { label: 'Report' },
      { label: 'Survey CTO' }
    ];

    this.exportItems = [
      {
        label: 'Export as PDF',
        icon: 'pi pi-file-pdf',
        command: () => {
          this.exportLabel = 'Export as PDF';
          this.exportFormat = 'pdf';
          this.exportAs(this.exportFormat);
        }
      },
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
      { name: 'ALL' },
      { name: 'AF(Additional Financing)' },
      { name: 'PP(Parent Project)' },
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
      this.messageService.add({severity:'error', summary:'Error', detail:'Failed to load states.'});
      this.isLoading = false;
      this.cdr.detectChanges();
    });
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
        this.messageService.add({severity:'error', summary:'Error', detail:'Failed to load counties.'});
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
        this.messageService.add({severity:'error', summary:'Error', detail:'Failed to load payams.'});
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
        this.messageService.add({severity:'error', summary:'Error', detail:'Failed to load bomas.'});
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
    this.cdr.detectChanges();
    this.messageService.add({severity:'success', summary:'Success', detail:'Form has been reset'});
  }

  searchSurveyData(): void {
    console.log('Searching Survey CTO data with form data:', this.searchForm.value);
    this.messageService.add({severity:'info', summary:'Info', detail:'Searching for Survey CTO data'});
  }

  importData(): void {
    if (!this.selectedFile) {
      this.messageService.add({severity:'warn', summary:'Warning', detail:'Please select a file to import.'});
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);

    this.messageService.add({severity:'info', summary:'Importing', detail:`${this.selectedFile.name} is being uploaded.`});
    this.http.post('/api/dummy-import-csv', formData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Upload Started',
          detail: `${this.selectedFile?.name} has been imported successfully.`,
        });
        this.selectedFile = null;
        this.csvUploader.nativeElement.value = ''; // Clear the input field
        this.cdr.detectChanges(); // Update button disabled state and UI
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: `Could not import ${this.selectedFile?.name}. Error: ${err.message}`,
        });
        this.selectedFile = null;
        this.csvUploader.nativeElement.value = ''; // Clear the input field
        this.cdr.detectChanges(); // Update button disabled state and UI
      },
    });
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    this.csvUploader.nativeElement.value = ''; // Clear the native file input
    this.cdr.detectChanges(); // Update button states and UI
    this.messageService.add({severity:'info', summary:'File Cleared', detail:'Selected file has been removed.'});
  }

  onFileSelect(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.selectedFile = element.files[0];
      console.log('Selected file:', this.selectedFile.name);
    } else {
      this.selectedFile = null;
    }
    this.cdr.detectChanges(); // Update button disabled state
  }

  exportAs(format: string): void {
    this.exportLabel = `Export as ${format.toUpperCase()}`;
    this.exportFormat = format;

    if (format === 'csv') {
      console.log('Exporting as CSV...');
      this.http.get('/api/dummy-export-csv').subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'CSV export started.',
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `CSV export failed. Error: ${err.message}`,
          });
        },
      });
    } else {
      const msg = `Exporting as ${format.toUpperCase()} is not available for now.`;
      console.log(msg);
      this.messageService.add({
        severity: 'warn',
        summary: 'Not Available',
        detail: msg,
      });
    }
  }

  onPageChange(event: PaginatorState): void {
    this.currentPage = event.page ?? 0;
    this.pageSize = event.rows ?? 10;
    this.searchSurveyData();
  }
}
