import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-metabase',
  standalone: true,
  imports: [],
  templateUrl: './metabase.html',
  styleUrl: './metabase.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Metabase {
  token = "eyJhbGciOiJIUzI1NiJ9.eyJyZXNvdXJjZSI6eyJkYXNoYm9hcmQiOjR9LCJwYXJhbXMiOnt9LCJpYXQiOjE3NzYwMDM2ODcsImV4cCI6MTc3NjAwNDI4NywiX2VtYmVkZGluZ19wYXJhbXMiOnsic3RhdGVfbmFtZSI6ImVuYWJsZWQiLCJwYXlhbV9uYW1lIjoiZW5hYmxlZCIsImJvbWFfbmFtZSI6ImVuYWJsZWQiLCJwYXltZW50X2N5Y2xlIjoiZW5hYmxlZCIsImNvdW50eV9uYW1lIjoiZW5hYmxlZCJ9fQ.jrmFFQI7sDuzIKJfsRTSbjWeycAjoedXlPAbTRx3eHg";
}
