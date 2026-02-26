import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyCtoImport } from './survey-cto-import';

describe('SurveyCtoImport', () => {
  let component: SurveyCtoImport;
  let fixture: ComponentFixture<SurveyCtoImport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyCtoImport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SurveyCtoImport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
