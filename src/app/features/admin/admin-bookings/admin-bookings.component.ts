import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking';

@Component({
  selector: 'app-admin-bookings',
  standalone: false,
  templateUrl: './admin-bookings.component.html',
  styleUrl: './admin-bookings.component.css'
})
export class AdminBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  loading: boolean = true;
  error: string = '';

  filterMode: 'ALL' | 'SPECIFIC' | 'RANGE' = 'ALL';
  specificDate: string = '';
  fromDate: string = '';
  toDate: string = '';
  filterError: string = '';

  constructor(
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchAllBookings();
  }

  fetchAllBookings(): void {
    this.loading = true;
    this.error = '';
    this.bookingService.getAllBookings().subscribe({
      next: (data: any) => {
        this.bookings = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Failed to fetch bookings', err);
        this.error = 'Failed to load bookings data.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  setFilterMode(mode: 'ALL' | 'SPECIFIC' | 'RANGE'): void {
    this.filterMode = mode;
    this.filterError = '';
    if (mode === 'ALL') {
      this.specificDate = '';
      this.fromDate = '';
      this.toDate = '';
      this.applyFilters();
    }
  }

  applyFilters(): void {
    this.filterError = '';
    if (this.filterMode === 'ALL') {
      this.filteredBookings = [...this.bookings];
    } else if (this.filterMode === 'SPECIFIC') {
      if (!this.specificDate) {
        this.filteredBookings = [...this.bookings];
      } else {
        const targetDateStr = this.specificDate;
        this.filteredBookings = this.bookings.filter(b => {
          const date = b.createdAt ? b.createdAt.substring(0, 10) : '';
          return date === targetDateStr;
        });
      }
    } else if (this.filterMode === 'RANGE') {
      if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
        this.filterError = 'From date cannot be after To date.';
        this.filteredBookings = [];
      } else if (this.fromDate && this.toDate) {
        this.filteredBookings = this.bookings.filter(b => {
          const date = b.createdAt ? b.createdAt.substring(0, 10) : '';
          if (!date) return false;
          return date >= this.fromDate && date <= this.toDate;
        });
      } else {
        this.filteredBookings = [...this.bookings];
      }
    }
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.setFilterMode('ALL');
  }
}
