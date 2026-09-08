import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingStateService } from '../../../core/services/booking-state.service';
import { PaymentService } from '../../../core/services/payment.service';
import { BookingService } from '../../../core/services/booking.service';
import { WalletService } from '../../../core/services/wallet.service';
import { PaymentStatus, PaymentRequest, PaymentDTO } from '../../../core/models/payment';

@Component({
  selector: 'app-payment',
  standalone:false,
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css',
})
export class PaymentComponent implements OnInit, OnDestroy {
  
  totalAmount: number = 0;
  paymentMethod: string = 'UPI';
  paymentStatus: string = 'INITIATED';
  errorMessage: string = '';
  bookingId: string = '';

  // Form fields
  upiId: string = '';

  // Timer
  countdownTimer: any;
  remainingTimeDisplay: string = '';

  // Wallet
  walletBalance: number = 0;
  useWallet: boolean = false;
  walletLoaded: boolean = false;

  get remainingAmount(): number {
    if (this.useWallet && this.walletBalance > 0) {
      return Math.max(0, this.totalAmount - this.walletBalance);
    }
    return this.totalAmount;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private bookingService: BookingService,
    private walletService: WalletService,
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
      this.fetchWalletBalance();
    });
  }

  fetchBookingDetails(): void {
    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (booking) => {
        this.totalAmount = booking.totalAmount;
        if (booking.bookingStatus === 'FAILED') {
          this.paymentStatus = 'EXPIRED';
          this.errorMessage = 'Booking payment window has expired.';
        } else if (booking.expiryTime) {
          this.startTimer(booking.expiryTime);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to fetch booking details.';
        this.cdr.markForCheck();
      }
    });
  }

  fetchWalletBalance(): void {
    this.walletService.getMyWallet().subscribe({
      next: (wallet) => {
        this.walletBalance = wallet.balance;
        this.walletLoaded = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.walletLoaded = true; // Still mark as loaded to proceed
      }
    });
  }

  toggleWallet(): void {
    this.useWallet = !this.useWallet;
  }

  setPaymentMethod(method: string): void {
    this.paymentMethod = method;
  }

  processPayment(): void {
    // Only require UPI ID if there's a remaining amount to be paid via UPI
    if (this.remainingAmount > 0 && this.paymentMethod === 'UPI' && !this.upiId.trim()) {
      return;
    }

    this.paymentStatus = 'PROCESSING';
    this.errorMessage = '';
    this.cdr.markForCheck();

    const request: PaymentRequest = {
      paymentMethod: this.remainingAmount === 0 ? 'WALLET' : this.paymentMethod,
      useWallet: this.useWallet
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

  startTimer(expiryTimeString: string): void {
    const expiryTime = new Date(expiryTimeString).getTime();
    
    this.countdownTimer = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiryTime - now;

      if (distance <= 0) {
        clearInterval(this.countdownTimer);
        this.remainingTimeDisplay = '00:00';
        this.paymentStatus = 'EXPIRED';
        this.errorMessage = 'Booking payment window has expired. Please start a new booking.';
        this.cdr.markForCheck();
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      this.remainingTimeDisplay = 
        (minutes < 10 ? '0' : '') + minutes + ':' + 
        (seconds < 10 ? '0' : '') + seconds;
      
      this.cdr.markForCheck();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }

  goBack(): void {
    this.router.navigate(['/booking-confirmation']);
  }
}

