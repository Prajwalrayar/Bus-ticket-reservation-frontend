import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperatorDashboardComponent } from './operator-dashboard.component';

describe('OperatorDashboardComponent', () => {
  let component: OperatorDashboardComponent;
  let fixture: ComponentFixture<OperatorDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OperatorDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
