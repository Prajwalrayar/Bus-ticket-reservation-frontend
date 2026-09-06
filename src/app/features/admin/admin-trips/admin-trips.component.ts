import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TripService } from '../../../core/services/trip.service';
import { TripDTO } from '../../../core/models/trip';

@Component({
  selector: 'app-admin-trips',
  standalone: false,
  templateUrl: './admin-trips.component.html',
  styleUrl: './admin-trips.component.css'
})
export class AdminTripsComponent implements OnInit {
  trips: TripDTO[] = [];
  loading: boolean = true;
  error: string = '';

  constructor(
    private tripService: TripService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.fetchAllTrips();
  }

  fetchAllTrips(): void {
    this.loading = true;
    this.error = '';
    this.tripService.getAllTrips().subscribe({
      next: (data: any) => {
        this.trips = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Failed to fetch trips', err);
        this.error = 'Failed to load trips data.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
