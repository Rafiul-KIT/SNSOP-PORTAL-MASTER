import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MneReports } from './mne-reports';

describe('MneReports', () => {
  let component: MneReports;
  let fixture: ComponentFixture<MneReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MneReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MneReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
