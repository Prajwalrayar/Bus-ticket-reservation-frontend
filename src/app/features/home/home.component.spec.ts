import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { SharedModule } from '../../shared/shared-module';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let routerNavigateSpy: jasmine.Spy;

  beforeEach(async () => {
    routerNavigateSpy = jasmine.createSpy('navigate');

    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      imports: [SharedModule],
      providers: [
        {
          provide: Router,
          useValue: { navigate: routerNavigateSpy },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of(convertToParamMap({})),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show validation error when search fields are empty', () => {
    component.searchBuses();
    expect(component.errorMessage).toContain('Please enter');
  });

  it('should reject identical cities', () => {
    component.fromCity = 'Chennai';
    component.toCity = 'Chennai';
    component.journeyDate = component.minDate;
    component.searchBuses();
    expect(component.errorMessage).toContain('cannot be the same');
  });
});
