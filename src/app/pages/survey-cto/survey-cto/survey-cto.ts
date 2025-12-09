import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
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
import { Loader } from '../../../components/loader/loader';

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
  ],
  templateUrl: './survey-cto.html',
  styleUrl: './survey-cto.scss',
  providers: [MessageService]
})
export class SurveyCto implements OnInit {
  isLoading = false;
  showAdvancedSearch = false;
  breadcrumbItems: MenuItem[] = [];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };
  searchForm: FormGroup;
  states: any[] = [];
  counties: any[] = [];
  payams: any[] = [];
  bomas: any[] = [];
  payrollData: any[] = [];
  totalRecords = 0;
  pageSize = 10;
  currentPage = 0;
  exportItems: MenuItem[] = [];
  exportLabel = 'Export as PDF';
  exportFormat = 'pdf';

  constructor(private fb: FormBuilder, private messageService: MessageService) {
    this.searchForm = this.fb.group({
      state: [null],
      county: [null],
      payam: [null],
      boma: [null],
      householdNumber: [null],
      name: [null],
      mobileNumber: [null],
      walletNumber: [null],
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
  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  onStateChange(state: any): void {
    console.log('State changed:', state);
  }

  onCountyChange(county: any): void {
    console.log('County changed:', county);
  }

  onPayamChange(payam: any): void {
    console.log('Payam changed:', payam);
  }

  resetForm(): void {
    this.searchForm.reset();
    this.messageService.add({severity:'success', summary:'Success', detail:'Form has been reset'});
  }

  searchPayroll(): void {
    console.log('Searching payroll with form data:', this.searchForm.value);
    this.messageService.add({severity:'info', summary:'Info', detail:'Searching for payroll data'});
  }

  importData(): void {
    console.log('Importing data...');
    this.messageService.add({severity:'info', summary:'Info', detail:'Import functionality is not yet implemented.'});
  }

  exportAs(format: string): void {
    this.exportLabel = `Export as ${format.toUpperCase()}`;
    this.exportFormat = format;
    console.log(`Exporting as ${format}...`);
    this.messageService.add({severity:'info', summary:'Info', detail:`Exporting as ${format} is not yet implemented.`});
  }

  onPageChange(event: PaginatorState): void {
    this.currentPage = event.page ?? 0;
    this.pageSize = event.rows ?? 10;
    this.searchPayroll();
  }
}
