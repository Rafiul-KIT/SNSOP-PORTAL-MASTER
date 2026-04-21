import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-economic-opportunities-template-importing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './economic-opportunities-template-importing.html',
  styleUrl: './economic-opportunities-template-importing.scss',
})
export class EconomicOpportunitiesTemplateImporting {
  selectedTemplate = '';
  selectedState = '';
  selectedCounty = '';
  selectedPayam = '';
  selectedBoma = '';
}
