import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from '../environments/environment';

export interface LandingSummary {
  totalBeneficiary: number;
  maleCount: number;
  femaleCount: number;
  lipwCount: number;
  disCount: number;
  totalWorkedBeneficiary: number;
  totalSspPaid: number;
  totalCompletedSubprojects: number;
}

@Injectable({
  providedIn: 'root',
})
export class LandingService {
  private readonly endpoint = 'api/public/landing/summary';

  // Public endpoint: uses a bare axios call so no bearer token is attached
  // and a 401 never triggers the ApiService logout redirect.
  async getSummary(): Promise<LandingSummary | null> {
    try {
      const res = await axios.get<LandingSummary>(`${environment.globalApi}${this.endpoint}`);
      return res.data || null;
    } catch (error) {
      console.error('Error fetching landing summary:', error);
      return null;
    }
  }
}
