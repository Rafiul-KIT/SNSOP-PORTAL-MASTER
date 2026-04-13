import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ChangeDetectorRef } from '@angular/core';
import { SignJWT } from 'jose';

// you will need to install via 'npm install jose' or in your package.json
const METABASE_SECRET_KEY = "900a8210d5a03e1982ed4621f9bc5192d26de8422bdf2617f5baa83e5aa4efad";

const payload = {
  resource: { dashboard: 4 },
  params: {},
};

@Component({
  selector: 'app-metabase',
  standalone: true,
  imports: [],
  templateUrl: './metabase.html',
  styleUrl: './metabase.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Metabase implements OnInit {
  token: string = "";
  error: string = "";

  constructor(private cdr: ChangeDetectorRef) {}

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

    console.log("Token generated successfully");
    this.cdr.detectChanges();
  }
}
