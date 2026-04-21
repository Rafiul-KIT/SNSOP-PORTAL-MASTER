import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-economic-opportunities-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './economic-opportunities-dashboard.html',
  styleUrl: './economic-opportunities-dashboard.scss',
})
export class EconomicOpportunitiesDashboard {}
