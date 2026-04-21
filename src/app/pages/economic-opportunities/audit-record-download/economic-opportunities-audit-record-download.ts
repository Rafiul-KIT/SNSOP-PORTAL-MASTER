import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-economic-opportunities-audit-record-download',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './economic-opportunities-audit-record-download.html',
  styleUrl: './economic-opportunities-audit-record-download.scss',
})
export class EconomicOpportunitiesAuditRecordDownload {
  selectedModule = '';
  fromDate = '';
  toDate = '';
}
