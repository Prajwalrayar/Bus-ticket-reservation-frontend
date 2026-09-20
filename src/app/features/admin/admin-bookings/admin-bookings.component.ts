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
  filterStatus: string = 'ALL';
  sortOption: string = 'RECENT';
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
    let temp = [...this.bookings];

    if (this.filterMode === 'SPECIFIC') {
      if (this.specificDate) {
        temp = temp.filter(b => (b.createdAt || '').substring(0, 10) === this.specificDate);
      }
    } else if (this.filterMode === 'RANGE') {
      if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
        this.filterError = 'From date cannot be after To date.';
        temp = [];
      } else if (this.fromDate && this.toDate) {
        temp = temp.filter(b => {
          const date = (b.createdAt || '').substring(0, 10);
          return date >= this.fromDate && date <= this.toDate;
        });
      }
    }

    if (this.filterStatus !== 'ALL') {
      temp = temp.filter(b => b.bookingStatus === this.filterStatus);
    }

    if (this.sortOption === 'RECENT') {
      temp.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (this.sortOption === 'OLDEST') {
      temp.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (this.sortOption === 'BOOKING_ID_ASC') {
      temp.sort((a, b) => (a.bookingReference || '').localeCompare(b.bookingReference || ''));
    } else if (this.sortOption === 'BOOKING_ID_DESC') {
      temp.sort((a, b) => (b.bookingReference || '').localeCompare(a.bookingReference || ''));
    } else if (this.sortOption === 'AMOUNT_ASC') {
      temp.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    } else if (this.sortOption === 'AMOUNT_DESC') {
      temp.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    }

    this.filteredBookings = temp;
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.filterStatus = 'ALL';
    this.sortOption = 'RECENT';
    this.setFilterMode('ALL');
  }
}
