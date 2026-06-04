import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutomatedTargetingBeneficiaryDetails } from './automated-targeting-beneficiary-details';

describe('AutomatedTargetingBeneficiaryDetails', () => {
  let component: AutomatedTargetingBeneficiaryDetails;
  let fixture: ComponentFixture<AutomatedTargetingBeneficiaryDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutomatedTargetingBeneficiaryDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutomatedTargetingBeneficiaryDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
