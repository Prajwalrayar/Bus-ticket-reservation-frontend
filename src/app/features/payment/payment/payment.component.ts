import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingStateService } from '../../../core/services/booking-state.service';
import { PaymentService } from '../../../core/services/payment.service';
import { BookingService } from '../../../core/services/booking.service';
import { PaymentStatus, PaymentRequest, PaymentDTO } from '../../../core/models/payment';

@Component({
  selector: 'app-payment',
  standalone:false,
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css',
})
export class PaymentComponent implements OnInit {
  
  totalAmount: number = 0;
  paymentMethod: string = 'UPI';
  paymentStatus: string = 'INITIATED';
  errorMessage: string = '';
  bookingId: string = '';

  // Form fields
  upiId: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private bookingService: BookingService,
    private bookingState: BookingStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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
    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (booking) => {
        this.totalAmount = booking.totalAmount;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to fetch booking details.';
        this.cdr.markForCheck();
      }
    });
  }

  setPaymentMethod(method: string): void {
    this.paymentMethod = method;
  }

  processPayment(): void {
    if (this.paymentMethod === 'UPI' && !this.upiId.trim()) {
      return;
    }

    this.paymentStatus = 'PROCESSING';
    this.errorMessage = '';
    this.cdr.markForCheck();

    const request: PaymentRequest = {
      paymentMethod: this.paymentMethod
    };

    this.paymentService.mockCheckout(this.bookingId, request).subscribe({
      next: (res) => {
        const payment = res.data;
        if (payment.paymentStatus === PaymentStatus.SUCCESS) {
          this.paymentStatus = 'SUCCESS';
          this.cdr.markForCheck();
          this.completeBooking(payment);
        } else {
          this.paymentStatus = 'FAILED';
          this.errorMessage = payment.failureReason || 'Payment failed. Please try again.';
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.paymentStatus = 'FAILED';
        this.errorMessage = err.error?.message || 'Payment failed due to server error. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  completeBooking(payment: PaymentDTO): void {
    setTimeout(() => {
      this.router.navigate(['/booking-success'], { 
        queryParams: { bookingId: this.bookingId },
        state: { payment: payment }
      });
    }, 1500);
  }

  goBack(): void {
    this.router.navigate(['/booking-confirmation']);
  }
}

