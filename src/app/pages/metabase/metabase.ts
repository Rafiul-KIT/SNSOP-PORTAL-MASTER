import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { SignJWT } from 'jose';

const METABASE_SITE_URL = "https://analytics.southsudansafetynet.info";
const METABASE_SECRET_KEY = "4aa8ebbd68eb349b3a5559d321f4ae8b1d10382ecc2724bce7fddc179d964859";

@Component({
  selector: 'app-metabase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metabase.html',
  styleUrl: './metabase.scss'
})
export class Metabase implements OnInit {
  currentDashboardId: number = 2; // Default dashboard
  dashboards = [
    { id: 2, name: 'Main Dashboard' },
    { id: 1, name: 'Overview' },
    { id: 3, name: 'Analytics' },
    { id: 4, name: 'Reports' }
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
