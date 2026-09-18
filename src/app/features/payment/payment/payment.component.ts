import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingStateService } from '../../../core/services/booking-state.service';
import { PaymentService } from '../../../core/services/payment.service';
import { BookingService } from '../../../core/services/booking.service';
import { WalletService } from '../../../core/services/wallet.service';
import { PaymentStatus, PaymentRequest, PaymentDTO } from '../../../core/models/payment';

declare var Razorpay: any;

// Removed manual UPI handlers since we are using Razorpay checkout modal

@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css',
})
export class PaymentComponent implements OnInit, OnDestroy {

  totalAmount: number = 0;
  paymentMethod: string = 'UPI';
  paymentStatus: string = 'INITIATED';
  errorMessage: string = '';
  bookingId: string = '';

  // Timer
  countdownTimer: any;
  remainingTimeDisplay: string = '';

  // Wallet
  walletBalance: number = 0;
  useWallet: boolean = false;
  walletLoaded: boolean = false;

  // Inline wallet recharge
  showRechargeForm: boolean = false;
  rechargeAmount: number = 100;
  rechargeError: string = '';
  rechargeSuccess: string = '';
  isRecharging: boolean = false;
  get remainingAmount(): number {
    if (this.useWallet && this.walletBalance > 0) {
      return Math.max(0, this.totalAmount - this.walletBalance);
    }
    return this.totalAmount;
  }

  /** How much the user needs to add to their wallet to cover the full booking */
  get walletShortfall(): number {
    return Math.max(0, this.totalAmount - this.walletBalance);
  }

  /** Minimum recharge needed: at least the shortfall, but never less than ₹100 */
  get suggestedRechargeAmount(): number {
    return Math.max(100, this.walletShortfall);
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
        this.walletBalance = Number(wallet.balance);
        this.walletLoaded = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.walletLoaded = true;
        this.cdr.markForCheck();
      }
    });
  }

  toggleWallet(): void {
    this.useWallet = !this.useWallet;
    this.cdr.markForCheck();
  }

  setPaymentMethod(method: string): void {
    this.paymentMethod = method;
    this.showRechargeForm = false;
    this.rechargeError = '';
    this.rechargeSuccess = '';
    this.cdr.markForCheck();
  }

  // ── Inline Recharge ──────────────────────────────────────────────────────

  openRechargeForm(): void {
    this.showRechargeForm = true;
    this.rechargeAmount = this.suggestedRechargeAmount;
    this.rechargeError = '';
    this.rechargeSuccess = '';
    this.cdr.markForCheck();
  }

  closeRechargeForm(): void {
    this.showRechargeForm = false;
    this.cdr.markForCheck();
  }

  async rechargeWallet(): Promise<void> {
    this.rechargeError = '';
    this.rechargeSuccess = '';

    if (this.rechargeAmount < 100) {
      this.rechargeError = 'Minimum recharge amount is ₹100.';
      this.cdr.markForCheck();
      return;
    }

    if (this.rechargeAmount > 5000) {
      this.rechargeError = 'Maximum recharge amount is ₹5000.';
      this.cdr.markForCheck();
      return;
    }

    this.isRecharging = true;
    this.cdr.markForCheck();

    const isScriptLoaded = await this.loadRazorpayScript();
    if (!isScriptLoaded) {
      this.rechargeError = 'Failed to load Razorpay SDK. Please check your connection.';
      this.isRecharging = false;
      this.cdr.markForCheck();
      return;
    }

    this.walletService.createRechargeOrder({ amount: this.rechargeAmount, upiId: '' }).subscribe({
      next: (orderData) => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount * 100, // paise
          currency: orderData.currency,
          name: 'Wallet Top-up',
          description: 'Recharging wallet by ₹' + this.rechargeAmount,
          order_id: orderData.orderId,
          handler: (response: any) => {
            this.verifyRechargeRazorpayPayment(response);
          },
          prefill: {
            name: 'Passenger',
          },
          modal: {
            ondismiss: () => {
              this.isRecharging = false;
              this.rechargeError = 'Top-up was cancelled by user.';
              this.cdr.markForCheck();
            }
          },
          theme: {
            color: '#dc3545'
          }
        };
        
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          this.isRecharging = false;
          this.rechargeError = response.error.description || 'Top-up failed.';
          this.cdr.markForCheck();
        });
        rzp.open();
      },
      error: (err) => {
        this.rechargeError = err.error?.message || 'Failed to initiate recharge.';
        this.isRecharging = false;
        this.cdr.markForCheck();
      }
    });
  }

  verifyRechargeRazorpayPayment(response: any): void {
    const verifyReq = {
      razorpayPaymentId: response.razorpay_payment_id,
      razorpayOrderId: response.razorpay_order_id,
      razorpaySignature: response.razorpay_signature
    };

    this.walletService.verifyRechargePayment(verifyReq).subscribe({
      next: (wallet) => {
        this.walletBalance = Number(wallet.balance);
        this.rechargeSuccess = `₹${this.rechargeAmount} added successfully! New balance: ₹${this.walletBalance}`;
        this.isRecharging = false;
        this.showRechargeForm = false;
        // Auto-enable wallet toggle
        if (this.walletBalance > 0) {
          this.useWallet = true;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.rechargeError = err.error?.message || 'Recharge verification failed.';
        this.isRecharging = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Payment ───────────────────────────────────────────────────────────────

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-checkout-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async processPayment(): Promise<void> {
    this.paymentStatus = 'PROCESSING';
    this.errorMessage = '';
    this.cdr.markForCheck();

    const request: PaymentRequest = {
      paymentMethod: this.remainingAmount === 0 ? 'WALLET' : 'RAZORPAY',
      useWallet: this.useWallet
    };

    if (this.remainingAmount === 0) {
      // Wallet completely covers the cost, fallback to mockCheckout for 0 amount
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
      return;
    }

    // Need to pay via gateway
    const isScriptLoaded = await this.loadRazorpayScript();
    if (!isScriptLoaded) {
      this.paymentStatus = 'FAILED';
      this.errorMessage = 'Failed to load Razorpay SDK. Please check your connection.';
      this.cdr.markForCheck();
      return;
    }

    this.paymentService.createRazorpayOrder(this.bookingId, request).subscribe({
      next: (res) => {
        const orderData = res.data;
        
        const options = {
          key: orderData.keyId,
          amount: orderData.amount * 100, // paise
          currency: orderData.currency,
          name: 'Bus Ticket Booking',
          description: 'Payment for Booking ID: ' + this.bookingId,
          order_id: orderData.orderId,
          handler: (response: any) => {
            this.verifyRazorpayPayment(response);
          },
          prefill: {
            name: 'Passenger',
          },
          modal: {
            ondismiss: () => {
              this.paymentStatus = 'FAILED';
              this.errorMessage = 'Payment was cancelled by user.';
              this.cdr.markForCheck();
            }
          },
          theme: {
            color: '#dc3545'
          }
        };
        
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          this.paymentStatus = 'FAILED';
          this.errorMessage = response.error.description || 'Payment failed.';
          this.cdr.markForCheck();
        });
        rzp.open();
      },
      error: (err) => {
        this.paymentStatus = 'FAILED';
        this.errorMessage = err.error?.message || 'Failed to create payment order.';
        this.cdr.markForCheck();
      }
    });
  }

  verifyRazorpayPayment(response: any): void {
    this.paymentStatus = 'PROCESSING';
    this.cdr.markForCheck();

    const verifyReq = {
      razorpayPaymentId: response.razorpay_payment_id,
      razorpayOrderId: response.razorpay_order_id,
      razorpaySignature: response.razorpay_signature
    };

    this.paymentService.verifyRazorpayPayment(this.bookingId, verifyReq).subscribe({
      next: (res) => {
        const payment = res.data;
        if (payment.paymentStatus === PaymentStatus.SUCCESS) {
          this.paymentStatus = 'SUCCESS';
          this.cdr.markForCheck();
          this.completeBooking(payment);
        } else {
          this.paymentStatus = 'FAILED';
          this.errorMessage = payment.failureReason || 'Payment verification failed.';
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.paymentStatus = 'FAILED';
        this.errorMessage = err.error?.message || 'Payment verification failed.';
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
