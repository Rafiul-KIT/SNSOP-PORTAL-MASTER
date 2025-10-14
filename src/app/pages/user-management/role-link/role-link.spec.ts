import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleLink } from './role-link';

describe('RoleLink', () => {
  let component: RoleLink;
  let fixture: ComponentFixture<RoleLink>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleLink]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleLink);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
