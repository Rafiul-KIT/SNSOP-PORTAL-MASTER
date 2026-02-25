import { Component, ChangeDetectorRef, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../../services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-survey-cto-import',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbModule,
    ButtonModule,
    Loader,
    InputTextModule,
    ProgressBarModule,
    TableModule,
    TooltipModule,
  ],
  templateUrl: './survey-cto-import.html',
  styleUrl: './survey-cto-import.scss'
})
export class SurveyCtoImport implements OnInit {
  @ViewChild('csvUploader') csvUploader!: ElementRef<HTMLInputElement>;
  isLoading = false;
  breadcrumbItems: MenuItem[] = [];
  breadcrumbHome: MenuItem = { icon: 'fas fa-home', routerLink: '/' };
  selectedFile: File | null = null;
  previewData: any[] = [];
  previewCols: any[] = [];
  totalRowsInFile = 0;

  constructor(
    private cdr: ChangeDetectorRef,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.breadcrumbItems = [
      { label: 'Survey CTO Import' }
    ];
  }

  onFileSelect(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const file = element.files[0];
      
      // Strict CSV check
      const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
      
      if (isCsv) {
        this.selectedFile = file;
        this.generatePreview(file);
      } else {
        Swal.fire({ 
          icon: 'error', 
          title: 'Invalid File Type', 
          text: 'Only CSV files are allowed for import.' 
        });
        this.clearSelectedFile();
      }
    } else {
      this.selectedFile = null;
      this.previewData = [];
      this.previewCols = [];
    }
    this.cdr.detectChanges();
  }

  generatePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      const rows = text.split(/\r?\n/).filter((row: string) => row.trim() !== '');
      if (rows.length > 0) {
        const headers = this.parseCsvLine(rows[0]);
        this.previewCols = headers.map((h: string) => ({ field: h, header: h }));
        
        const data = [];
        for (let i = 1; i < rows.length; i++) {
          const values = this.parseCsvLine(rows[i]);
          const rowObj: any = {};
          headers.forEach((h: string, index: number) => {
            rowObj[h] = values[index] || '';
          });
          data.push(rowObj);
        }
        this.previewData = data;
        this.totalRowsInFile = data.length;
      }
      this.cdr.detectChanges();
    };
    reader.readAsText(file);
  }

  private parseCsvLine(line: string): string[] {
    // Basic CSV line parser that handles quotes
    const result = [];
    let curValue = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(curValue.trim());
        curValue = "";
      } else {
        curValue += char;
      }
    }
    result.push(curValue.trim());
    return result;
  }

  importData(): void {
    if (!this.selectedFile) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please select a file to import.' });
      return;
    }

    Swal.fire({
      title: 'Importing in progress',
      html: '<div class="progress" style="margin-top: 20px;"><div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div></div>',
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };

    this.apiService.POST('api/surveycto/revisiting/upload', formData, 'global', config)
      .then((response) => {
        Swal.close();
        const result = response.data;
        const successMessage = `
          <div style="text-align: left; padding: 0 1rem;">
            <p class="mb-1"><b>File:</b> ${result.fileName}</p>
            <p class="mb-1"><b>Total Rows:</b> ${result.totalRows}</p>
            <p class="mb-1"><b>Saved:</b> ${result.savedRows}</p>
            <p class="mb-1"><b>Skipped:</b> ${result.skippedRows}</p>
            ${result.errors && result.errors.length > 0 ? `<p class="text-danger mb-1"><b>Errors:</b> ${result.errors.length}</p>` : ''}
          </div>
        `;
        Swal.fire({
          icon: 'success',
          title: 'Import Successful',
          html: successMessage,
        });
        this.clearSelectedFile(false);
      })
      .catch((err) => {
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: `Could not import ${this.selectedFile?.name}. Error: ${err.message}`,
        });
      });
  }

  clearSelectedFile(showNotification: boolean = false): void {
    this.selectedFile = null;
    this.previewData = [];
    this.previewCols = [];
    this.totalRowsInFile = 0;
    if (this.csvUploader?.nativeElement) {
      this.csvUploader.nativeElement.value = '';
    }
    this.cdr.detectChanges();
    if (showNotification) {
      Swal.fire({ icon: 'info', title: 'File Cleared', text: 'Selected file has been removed.' });
    }
  }
}
