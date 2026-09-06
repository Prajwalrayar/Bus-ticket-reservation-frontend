import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportDashboard } from './support-dashboard';

describe('SupportDashboard', () => {
  let component: SupportDashboard;
  let fixture: ComponentFixture<SupportDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SupportDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(SupportDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
