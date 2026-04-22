import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Start with 1 to cover initial app bootstrap
  private _loadingCount = new BehaviorSubject<number>(1);
  
  // Only show if count > 0
  loading$ = this._loadingCount.pipe(
    map(count => count > 0)
  );

  show() {
    this._loadingCount.next(this._loadingCount.value + 1);
  }

  hide() {
    const nextCount = Math.max(0, this._loadingCount.value - 1);
    this._loadingCount.next(nextCount);
  }

  /**
   * Safety reset (use if a major error happens)
   */
  reset() {
    this._loadingCount.next(0);
  }
}
