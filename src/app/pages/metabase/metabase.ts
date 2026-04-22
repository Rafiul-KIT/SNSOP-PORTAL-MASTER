import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { SignJWT } from 'jose';

const METABASE_SITE_URL = "https://analytics.southsudansafetynet.info";
const METABASE_SECRET_KEY = "900a8210d5a03e1982ed4621f9bc5192d26de8422bdf2617f5baa83e5aa4efad";

@Component({
  selector: 'app-metabase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metabase.html',
  styleUrl: './metabase.scss'
})
export class Metabase implements OnInit {
  currentDashboardId: number = 6; // Default dashboard
  dashboards = [
    { id: 6, name: 'Latest Beneficiaries' },
    { id: 7, name: 'GRM Group By ' },
    { id: 5, name: 'Payment Report' },
    { id: 4, name: 'Reconciliation Summary Report' }
  ];

  token: string = "";
  iframeUrl: SafeResourceUrl | null = null;
  error: string = "";
  isLoading: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    await this.loadDashboard(this.currentDashboardId);
  }

  async loadDashboard(id: number) {
    this.currentDashboardId = id;
    this.isLoading = true;
    this.error = "";
    this.iframeUrl = null; // Clear current iframe to show loading

    try {
      await this.generateToken(id);
    } catch (err: any) {
      console.error("Token generation failed:", err);
      this.error = err.message || "Unknown error";
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async generateToken(dashboardId: number) {
    const payload = {
      resource: { dashboard: dashboardId },
      params: {},
    };

    const secret = new TextEncoder().encode(METABASE_SECRET_KEY);

    this.token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('10m')
      .sign(secret);

    const url = `${METABASE_SITE_URL}/embed/dashboard/${this.token}#bordered=true&titled=true`;
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
