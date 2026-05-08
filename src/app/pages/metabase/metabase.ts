import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { SignJWT } from 'jose';
import { ApiService } from '../../../services/api.service';

const METABASE_SITE_URL = "https://analytics.southsudansafetynet.info";
const METABASE_SECRET_KEY = "9ac3605622effc33ebca721a877b0de842724a15ca8826c1869498ef283a1399";

interface MetabaseDashboard {
  id: number;
  name: string;
  description?: string;
  creatorId?: number;
}

@Component({
  selector: 'app-metabase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metabase.html',
  styleUrl: './metabase.scss'
})
export class Metabase implements OnInit {
  currentDashboardId: number | null = null;
  dashboards: MetabaseDashboard[] = [];
  token: string = "";
  iframeUrl: SafeResourceUrl | null = null;
  error: string = "";
  isLoading: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private apiService: ApiService
  ) {}

  async ngOnInit() {
    await this.fetchDashboards();
  }

  get currentDashboardName(): string {
    return this.dashboards.find(dashboard => dashboard.id === this.currentDashboardId)?.name || 'Dashboard';
  }

  async fetchDashboards() {
    this.isLoading = true;
    this.error = "";
    this.iframeUrl = null;

    try {
      const response = await this.apiService.GET<MetabaseDashboard[] | { data: MetabaseDashboard[] }>('/client/get-dashboards');
      const responseBody = response.data;
      const data = Array.isArray(responseBody) ? responseBody : responseBody?.data;

      this.dashboards = (data || []).filter(dashboard => Number.isFinite(dashboard?.id) && !!dashboard?.name);

      if (!this.dashboards.length) {
        this.currentDashboardId = null;
        this.error = 'No dashboards found.';
        return;
      }

      await this.loadDashboard(this.dashboards[0].id);
    } catch (err: any) {
      console.error("Dashboard list fetch failed:", err);
      this.currentDashboardId = null;
      this.error = err?.response?.data?.message || err.message || "Unable to fetch dashboards.";
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
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
