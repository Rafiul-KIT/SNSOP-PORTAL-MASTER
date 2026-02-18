import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyCtoDashboard } from './survey-cto-dashboard';

describe('SurveyCtoDashboard', () => {
  let component: SurveyCtoDashboard;
  let fixture: ComponentFixture<SurveyCtoDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyCtoDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SurveyCtoDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
