import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { TripService } from '../../../core/services/trip.service';
import { PaymentService } from '../../../core/services/payment.service';
import { Booking } from '../../../core/models/booking';
import { TripDTO } from '../../../core/models/trip';
import { PaymentDTO } from '../../../core/models/payment';

@Component({
  selector: 'app-booking-success',
  standalone: false,
  templateUrl: './booking-success.html',
  styleUrl: './booking-success.css'
})
export class BookingSuccess implements OnInit {
  bookingId: string = '';
  booking: Booking | null = null;
  trip: TripDTO | null = null;
  payment: PaymentDTO | null = null;
  loading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private tripService: TripService,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['payment']) {
      this.payment = navigation.extras.state['payment'];
    }
  }

  ngOnInit(): void {
    if (!this.payment && history.state?.payment) {
      this.payment = history.state.payment;
    }

    this.route.queryParams.subscribe(params => {
      this.bookingId = params['bookingId'];
      if (!this.bookingId) {
        this.router.navigate(['/']);
        return;
      }
      this.fetchBookingDetails();
    });
  }

  fetchBookingDetails(): void {
    this.loading = true;
    this.cdr.markForCheck();
    
    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (booking) => {
        this.booking = booking;
        this.fetchTripDetails(booking.tripId);
        
        if (!this.payment) {
          this.fetchPaymentDetails();
        } else {
          this.checkLoadingComplete();
        }
      },
      error: (err) => {
        console.error('Error fetching booking', err);
        this.errorMessage = 'Unable to retrieve booking details.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  fetchTripDetails(tripId: string): void {
    this.tripService.getTripById(tripId).subscribe({
      next: (res) => {
        this.trip = res.data;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error fetching trip', err);
        this.checkLoadingComplete();
      }
    });
  }

  fetchPaymentDetails(): void {
    this.paymentService.getPaymentsByBooking(this.bookingId).subscribe({
      next: (res) => {
        const payments = res.data;
        if (payments && payments.length > 0) {
          this.payment = payments[payments.length - 1];
        }
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error fetching payments', err);
        this.checkLoadingComplete();
      }
    });
  }

  checkLoadingComplete(): void {
    if (this.booking && this.trip !== undefined && this.payment !== undefined) {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  viewTicket(): void {
    if (this.booking?.bookingReference) {
      this.router.navigate(['/ticket'], { queryParams: { bookingReference: this.booking.bookingReference } });
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}

