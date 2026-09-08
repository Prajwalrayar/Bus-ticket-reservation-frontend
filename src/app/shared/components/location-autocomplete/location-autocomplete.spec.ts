import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationAutocomplete } from './location-autocomplete';

describe('LocationAutocomplete', () => {
  let component: LocationAutocomplete;
  let fixture: ComponentFixture<LocationAutocomplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LocationAutocomplete],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationAutocomplete);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
