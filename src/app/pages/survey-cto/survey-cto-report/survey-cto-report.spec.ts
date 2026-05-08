import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyCtoReport } from './survey-cto-report';

describe('SurveyCtoReport', () => {
  let component: SurveyCtoReport;
  let fixture: ComponentFixture<SurveyCtoReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyCtoReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SurveyCtoReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
