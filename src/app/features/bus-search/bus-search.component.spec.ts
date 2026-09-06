import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusSearchComponent } from './bus-search.component';

describe('BusSearchComponent', () => {
  let component: BusSearchComponent;
  let fixture: ComponentFixture<BusSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BusSearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BusSearchComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
