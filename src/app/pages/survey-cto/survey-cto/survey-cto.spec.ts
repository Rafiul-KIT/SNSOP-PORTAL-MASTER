import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyCto } from './survey-cto';

describe('SurveyCto', () => {
  let component: SurveyCto;
  let fixture: ComponentFixture<SurveyCto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyCto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SurveyCto);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
