import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingStateService } from '../../../core/services/booking-state.service';
import { PaymentService } from '../../../core/services/payment.service';
import { BookingService } from '../../../core/services/booking.service';
import { WalletService } from '../../../core/services/wallet.service';
import { PaymentStatus, PaymentRequest, PaymentDTO } from '../../../core/models/payment';

// Valid UPI handle suffixes used by real Indian payment apps/banks
const VALID_UPI_HANDLES = [
  'ybl', 'upi', 'oksbi', 'okaxis', 'okicici', 'okhdfcbank', 'okbizaxis',
  'paytm', 'paytmbank', 'naviaxis', 'axl', 'fbl', 'ibl', 'indus', 'kotak',
  'allbank', 'andb', 'barodampay', 'boi', 'citi', 'citibanknri', 'cnrb',
  'centralbank', 'eazypay', 'equitas', 'federal', 'finobank', 'hdfcbankjd',
  'hsbc', 'idbi', 'idfc', 'idfcbank', 'idfcfirst', 'ikwik', 'indbank',
  'iob', 'jkb', 'jsb', 'juspay', 'karnataka', 'kvb', 'lime', 'lvb', 'mahb',
  'nsdl', 'obc', 'pingpay', 'pnb', 'pockets', 'psb', 'rbl', 'rmhdfcbank',
  'sbi', 'sbiepay', 'sc', 'scb', 'shriramhfl', 'slicepay', 'superyes',
  'tjsb', 'ubi', 'ucb', 'unionbank', 'utbi', 'vijb', 'waaxis', 'yesbankltd',
  'airtel', 'airtelpaymentsbank', 'amazonnew', 'apl', 'bhim', 'cbp', 'dlb',
  'dz', 'fam', 'gjsb', 'gpay', 'imobile', 'kbl', 'kmb', 'kpsc', 'laxmi',
  'niyoicici', 'postbank', 'ratnaker', 'rns', 'rpcb', 'rupay', 'sib', 'syndicate',
  'tapicici', 'timecosmos', 'uco', 'united', 'utiitsl', 'vijaya', 'zoicici'
];

const UPI_REGEX = new RegExp(
  '^[a-zA-Z0-9._-]{3,256}@(' + VALID_UPI_HANDLES.join('|') + ')$'
);

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
  upiError: string = '';

  // Form fields
  upiId: string = '';

  // Timer
  countdownTimer: any;
  remainingTimeDisplay: string = '';

  // Wallet
  walletBalance: number = 0;
  useWallet: boolean = false;
  walletLoaded: boolean = false;

  // Inline wallet recharge
  showRechargeForm: boolean = false;
  rechargeUpiId: string = '';
  rechargeAmount: number = 100;
  rechargeUpiError: string = '';
  rechargeError: string = '';
  rechargeSuccess: string = '';
  isRecharging: boolean = false;

  /** Amount still required after applying wallet balance */
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
    this.upiError = '';
    this.showRechargeForm = false;
    this.rechargeError = '';
    this.rechargeSuccess = '';
    this.cdr.markForCheck();
  }

  isValidUpi(id: string): boolean {
    return UPI_REGEX.test(id.trim());
  }

  validateUpi(): void {
    if (!this.upiId.trim()) {
      this.upiError = 'UPI ID is required.';
    } else if (!this.isValidUpi(this.upiId)) {
      this.upiError = 'Invalid UPI ID. Use a valid format like name@ybl, name@okaxis, name@paytm etc.';
    } else {
      this.upiError = '';
    }
    this.cdr.markForCheck();
  }

  // ── Inline Recharge ──────────────────────────────────────────────────────

  openRechargeForm(): void {
    this.showRechargeForm = true;
    this.rechargeAmount = this.suggestedRechargeAmount;
    this.rechargeUpiId = '';
    this.rechargeUpiError = '';
    this.rechargeError = '';
    this.rechargeSuccess = '';
    this.cdr.markForCheck();
  }

  closeRechargeForm(): void {
    this.showRechargeForm = false;
    this.cdr.markForCheck();
  }

  validateRechargeUpi(): void {
    if (!this.rechargeUpiId.trim()) {
      this.rechargeUpiError = 'UPI ID is required.';
    } else if (!this.isValidUpi(this.rechargeUpiId)) {
      this.rechargeUpiError = 'Invalid UPI ID. Use a valid format like name@ybl, name@okaxis, name@paytm etc.';
    } else {
      this.rechargeUpiError = '';
    }
    this.cdr.markForCheck();
  }

  rechargeWallet(): void {
    this.rechargeError = '';
    this.rechargeSuccess = '';

    if (this.rechargeAmount < 100) {
      this.rechargeError = 'Minimum recharge amount is ₹100.';
      this.cdr.markForCheck();
      return;
    }
    if (!this.rechargeUpiId.trim() || !this.isValidUpi(this.rechargeUpiId)) {
      this.validateRechargeUpi();
      return;
    }

    this.isRecharging = true;
    this.cdr.markForCheck();

    this.walletService.rechargeWallet({ amount: this.rechargeAmount, upiId: this.rechargeUpiId }).subscribe({
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
        this.rechargeError = err.error?.message || 'Recharge failed. Please try again.';
        this.isRecharging = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Payment ───────────────────────────────────────────────────────────────

  processPayment(): void {
    this.upiError = '';

    if (this.remainingAmount > 0 && this.paymentMethod === 'UPI') {
      if (!this.upiId.trim()) {
        this.upiError = 'UPI ID is required.';
        this.cdr.markForCheck();
        return;
      }
      if (!this.isValidUpi(this.upiId)) {
        this.upiError = 'Invalid UPI ID. Use a valid format like name@ybl, name@okaxis, name@paytm etc.';
        this.cdr.markForCheck();
        return;
      }
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
