import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SignJWT } from 'jose';

const METABASE_SITE_URL = "https://analytics.southsudansafetynet.info";
const METABASE_SECRET_KEY = "4aa8ebbd68eb349b3a5559d321f4ae8b1d10382ecc2724bce7fddc179d964859";

const payload = {
  resource: { dashboard: 2 },
  params: {},
};

@Component({
  selector: 'app-metabase',
  standalone: true,
  imports: [],
  templateUrl: './metabase.html',
  styleUrl: './metabase.scss'
})
export class Metabase implements OnInit {
  token: string = "";
  iframeUrl: SafeResourceUrl | null = null;
  error: string = "";

  constructor(
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    try {
      await this.generateToken();
    } catch (err: any) {
      console.error("Token generation failed:", err);
      this.error = err.message || "Unknown error";
      this.cdr.detectChanges();
    }
  }

  async generateToken() {
    console.log("Generating Metabase token...");
    // Convert secret key to Uint8Array as expected by jose
    const secret = new TextEncoder().encode(METABASE_SECRET_KEY);

    this.token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('10m')
      .sign(secret);

    const url = `${METABASE_SITE_URL}/embed/dashboard/${this.token}#bordered=true&titled=true`;
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    console.log("Token and iframe URL generated successfully");
    this.cdr.detectChanges();
  }
}
