import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { TripService } from '../../../core/services/trip.service';
import { CancellationService } from '../../../core/services/cancellation.service';
import { SavedPassengerService } from '../../../core/services/saved-passenger.service';
import { ReviewService } from '../../../core/services/review.service';
import { Booking } from '../../../core/models/booking';
import { TripDTO } from '../../../core/models/trip';
import { CancellationDTO, CancellationEstimateDTO } from '../../../core/models/cancellation';
import { SavedPassengerDTO, SavedPassengerRequest } from '../../../core/models/saved-passenger';
import { ReviewDTO, ReviewCreateRequest } from '../../../core/models/review';
import { UserService } from '../../../core/services/user.service';
import { UserDTO } from '../../../core/models/user';
import { SupportTicketService } from '../../../core/services/support-ticket.service';
import { SupportTicketDTO, SupportTicketCreateRequest, SupportTicketWithMessagesDTO } from '../../../core/models/support-ticket';
import { WalletService } from '../../../core/services/wallet.service';
import { WalletTransactionDTO } from '../../../core/models/wallet';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CustomValidators } from '../../../core/validators/custom-validators';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ThemeService } from '../../../core/services/theme.service';
import { ConfirmService } from '../../../core/services/confirm.service';

export interface UIBooking {
  bookingId: string;
  bookingReference: string;
  status: string;
  from: string;
  to: string;
  operator: string;
  fare: number;
  date: Date | null;
  time: string;
  seats: string[];
  isCompletedJourney: boolean;
  canCancel: boolean;
  isStarted: boolean;
  segments?: any[];
}

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  activeTab: 'BOOKINGS' | 'PASSENGERS' | 'SETTINGS' | 'SUPPORT' | 'POLICIES' | 'WALLET' | 'PAYMENT_METHODS' | 'OFFERS' | 'ABOUT' | 'COUNTRY' | 'CURRENCY' | 'LANGUAGE' | 'APPEARANCE' | 'NOTIFICATIONS' | 'BOOKING_PREFS' = 'BOOKINGS';
  showMenu: boolean = true;
  selectedLanguage: string = 'en';
  country: string = 'India';
  currency: string = 'INR';
  notificationsEnabled: boolean = true;
  promotionsEnabled: boolean = false;
  seatPreference: string = 'Window';
  mealPreference: string = 'Vegetarian';
  bookingTab: 'UPCOMING' | 'COMPLETED' | 'CANCELLED' = 'UPCOMING';
  openPolicyTab: string = 'cancellation';

  myTickets: SupportTicketDTO[] = [];
  loadingTickets: boolean = false;
  
  // Wallet & Stats State
  walletBalance: number | null = null;
  walletTransactions: WalletTransactionDTO[] = [];
  loadingWalletTransactions: boolean = false;
  totalDistance: number = 0;
  carbonSavings: number = 0;
  
  showSupportModal: boolean = false;
  supportForm!: FormGroup;
  supportFormError: string = '';
  supportFormSuccess: string = '';
  selectedFile: File | null = null;
  fileError: string = '';

  readonly ISSUE_CATEGORIES: { [key: string]: string[] } = {
    'Booking': ['Booking Failed', 'Did not receive ticket', 'Incorrect Date/Time'],
    'Payment': ['Payment Failed', 'Amount Deducted but Booking Failed', 'Duplicate Payment', 'Payment Pending', 'Incorrect Amount Charged'],
    'Cancellation & Refund': ['Refund not received', 'Incorrect refund amount', 'Unable to cancel'],
    'Seat': ['Seat number changed', 'Different seat type provided'],
    'Trip/Bus': ['Bus delayed', 'Bus cancelled', 'Different bus provided', 'AC not working', 'Poor hygiene'],
    'Boarding/Dropping': ['Bus did not stop at boarding point', 'Dropped at wrong point', 'Staff behavior'],
    'Ticket/QR Code': ['Unable to download ticket', 'QR code not scannable'],
    'Wallet': ['Cashback not received', 'Unable to use wallet balance'],
    'Offers/Coupons': ['Coupon code invalid', 'Discount not applied'],
    'Account': ['Unable to update profile', 'Password reset issue'],
    'Lost & Found': ['Lost luggage', 'Left item in bus'],
    'Other': ['General inquiry', 'Other issue']
  };

  get availableIssueTypes(): string[] {
    const category = this.supportForm?.get('issueCategory')?.value;
    return category ? this.ISSUE_CATEGORIES[category] || [] : [];
  }

  get showUpcomingBookings(): boolean {
    const category = this.supportForm?.get('issueCategory')?.value;
    if (!category) return true;
    return ['Booking', 'Ticket/QR Code', 'Seat', 'Payment', 'Wallet', 'Offers/Coupons', 'Account', 'Other'].includes(category);
  }

  get showCompletedBookings(): boolean {
    const category = this.supportForm?.get('issueCategory')?.value;
    if (!category) return true;
    return ['Trip/Bus', 'Boarding/Dropping', 'Lost & Found', 'Payment', 'Wallet', 'Offers/Coupons', 'Account', 'Other'].includes(category);
  }

  get showCancelledBookings(): boolean {
    const category = this.supportForm?.get('issueCategory')?.value;
    if (!category) return false;
    return ['Cancellation & Refund', 'Payment', 'Wallet', 'Offers/Coupons', 'Account', 'Other'].includes(category);
  }

  upcomingBookings: UIBooking[] = [];
  completedBookings: UIBooking[] = [];
  cancelledBookings: UIBooking[] = [];
  
  myRawBookings: Booking[] = []; // Store raw bookings for detailed view
  
  // --- Booking Details Modal State ---
  selectedBookingDetails: Booking | null = null;
  selectedBookingCancellation: CancellationDTO | null = null;
  bookingDetailsLoading: boolean = false;
  bookingDetailsError: string = '';

  loadingBookings: boolean = true;
  loadingPassengers: boolean = false;
  cancelError: string = '';
  cancelSuccess: string = '';

  // Cancellation State
  selectedBookingIdToCancel: string | null = null;
  cancelReason: string = '';
  showCancelConfirmModal: boolean = false;
  showCancelResultModal: boolean = false;
  cancellationResult: CancellationDTO | null = null;
  cancellationEstimate: CancellationEstimateDTO | null = null;

  // Tracking State
  showTrackingModal: boolean = false;
  trackingBooking: UIBooking | null = null;

  // Saved Passenger State
  savedPassengers: SavedPassengerDTO[] = [];
  showPassengerModal: boolean = false;
  editingPassengerId: string | null = null;
  passengerForm: SavedPassengerRequest = {
    passengerName: '',
    age: 0,
    gender: 'MALE',
    idType: '',
    idNumber: '',
    contactNumber: ''
  };
  passengerError: string = '';

  // Review State
  reviewsByBookingId: { [bookingId: string]: ReviewDTO } = {};
  showReviewModal: boolean = false;
  selectedBookingIdForReview: string | null = null;
  reviewForm: ReviewCreateRequest = { rating: 5, comment: '' };
  reviewError: string = '';
  isEditingReview: boolean = false;

  // Ticket Thread State
  selectedTicketThread: SupportTicketWithMessagesDTO | null = null;
  ticketThreadLoading: boolean = false;

  // Profile Edit State
  myProfile: UserDTO | null = null;
  profileForm!: FormGroup;
  profileUpdateError: string = '';
  profileUpdateSuccess: string = '';

  // Change Password State
  passwordForm!: FormGroup;
  passwordError: string = '';
  passwordSuccess: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private tripService: TripService,
    private cancellationService: CancellationService,
    private savedPassengerService: SavedPassengerService,
    private reviewService: ReviewService,
    private userService: UserService,
    private fb: FormBuilder,
    public themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    private supportTicketService: SupportTicketService,
    private walletService: WalletService,
    private confirmService: ConfirmService
  ) {
    this.profileForm = this.fb.group({
      userName: ['', [Validators.required, CustomValidators.validName()]],
      mobileNumber: ['', [Validators.required, CustomValidators.validIndianPhone()]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, CustomValidators.validPassword()]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.supportForm = this.fb.group({
      issueCategory: ['', Validators.required],
      issueType: ['', Validators.required],
      issueSubject: ['', [Validators.required, Validators.maxLength(100)]],
      bookingReference: [''],
      issueDescription: ['', [Validators.required, Validators.maxLength(1000)]]
    });

    this.supportForm.get('issueCategory')?.valueChanges.subscribe(() => {
      this.supportForm.get('issueType')?.setValue('');
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  get pf() { return this.profileForm.controls; }
  get pwf() { return this.passwordForm.controls; }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'settings') {
        this.activeTab = 'SETTINGS';
      }
    });

    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        const validTabs = ['BOOKINGS', 'PASSENGERS', 'SETTINGS', 'SUPPORT', 'POLICIES', 'WALLET', 'PAYMENT_METHODS', 'OFFERS', 'ABOUT', 'COUNTRY', 'CURRENCY', 'LANGUAGE', 'APPEARANCE', 'NOTIFICATIONS', 'BOOKING_PREFS'];
        const tab = fragment.toUpperCase();
        if (validTabs.includes(tab)) {
          this.setTab(tab as any);
        }
      }
    });

    this.fetchMyProfile();
    this.fetchMyReviews();
    this.fetchMyBookings();
    this.fetchMyWallet();
    
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang) {
      this.selectedLanguage = savedLang;
    }
  }

  fetchMyWallet(): void {
    this.walletService.getMyWallet().subscribe({
      next: (wallet) => {
        this.walletBalance = wallet.balance;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching wallet balance', err);
      }
    });
  }

  changeLanguage(lang: string): void {
    this.selectedLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    // Future: trigger translation service update here
  }

  setTab(tab: 'BOOKINGS' | 'PASSENGERS' | 'SETTINGS' | 'SUPPORT' | 'POLICIES' | 'WALLET' | 'PAYMENT_METHODS' | 'OFFERS' | 'ABOUT' | 'COUNTRY' | 'CURRENCY' | 'LANGUAGE' | 'APPEARANCE' | 'NOTIFICATIONS' | 'BOOKING_PREFS'): void {
    this.activeTab = tab;
    this.showMenu = false;
    
    if (tab === 'PASSENGERS' && this.savedPassengers.length === 0) {
      this.fetchSavedPassengers();
    }
    if (tab === 'SETTINGS' && !this.myProfile) {
      this.fetchMyProfile();
    }
    if (tab === 'SUPPORT' && this.myTickets.length === 0) {
      this.fetchMyTickets();
    }
    if (tab === 'WALLET' && this.walletTransactions.length === 0) {
      this.fetchWalletTransactions();
    }
    
    this.cdr.markForCheck();
  }
  
  fetchWalletTransactions(): void {
    this.loadingWalletTransactions = true;
    this.walletService.getMyTransactions().subscribe({
      next: (txns) => {
        this.walletTransactions = txns;
        this.loadingWalletTransactions = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching wallet transactions', err);
        this.loadingWalletTransactions = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  goBackToMenu(): void {
    this.showMenu = true;
    this.router.navigate([], { fragment: undefined, queryParamsHandling: 'preserve' });
    this.cdr.markForCheck();
  }

  // --- SUPPORT TICKETS ---

  fetchMyTickets(): void {
    this.loadingTickets = true;
    this.supportTicketService.getMyTickets().subscribe({
      next: (tickets) => {
        this.myTickets = tickets.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt).getTime();
          return dateB - dateA;
        });
        this.loadingTickets = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load tickets', err);
        this.loadingTickets = false;
        this.cdr.markForCheck();
      }
    });
  }

  // --- SUPPORT TICKETS CONVERSATION STATE ---
  selectedTicket: import('../../../core/models/support-ticket').SupportTicketWithMessagesDTO | null = null;
  selectedTicketLoading: boolean = false;
  selectedTicketError: string = '';
  replyMessage: string = '';
  replyLoading: boolean = false;

  viewTicketDetail(ticketId: string): void {
    this.selectedTicketLoading = true;
    this.selectedTicketError = '';
    this.selectedTicket = null;
    this.showSupportModal = false; // Ensure create modal is closed

    this.supportTicketService.getTicketWithMessages(ticketId).subscribe({
      next: (ticket) => {
        this.selectedTicket = ticket;
        this.selectedTicketLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.selectedTicketError = err.error?.message || 'Failed to load ticket details';
        this.selectedTicketLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  closeTicketView(): void {
    this.selectedTicket = null;
    this.replyMessage = '';
  }

  focusReplyBox(): void {
    this.replyMessage = 'No, I still need help. ';
    setTimeout(() => {
      const el = document.getElementById('replyBox');
      if (el) el.focus();
    }, 0);
  }

  sendReply(): void {
    if (!this.selectedTicket || !this.replyMessage.trim()) return;
    this.replyLoading = true;
    
    const request = {
      message: this.replyMessage,
      isInternal: false
    };

    this.supportTicketService.addMessage(this.selectedTicket.ticketId, request).subscribe({
      next: () => {
        this.replyLoading = false;
        this.replyMessage = '';
        this.viewTicketDetail(this.selectedTicket!.ticketId);
        this.fetchMyTickets();
      },
      error: (err) => {
        this.selectedTicketError = err.error?.message || 'Failed to send reply';
        this.replyLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  resolveTicket(ticketId: string): void {
    this.supportTicketService.resolveTicket(ticketId).subscribe({
      next: () => { 
        this.fetchMyTickets();
        if (this.selectedTicket && this.selectedTicket.ticketId === ticketId) {
          this.viewTicketDetail(ticketId);
        }
      },
      error: (err) => {
        this.selectedTicketError = err.error?.message || 'Failed to resolve ticket';
        this.cdr.markForCheck();
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'OPEN': return 'bg-primary';
      case 'ASSIGNED': return 'bg-info text-dark';
      case 'IN_PROGRESS': return 'bg-warning text-dark';
      case 'WAITING_FOR_PASSENGER': return 'bg-danger'; // Requires action
      case 'PASSENGER_REPLIED': return 'bg-success bg-opacity-75';
      case 'RESOLVED': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'HIGH': return 'text-danger fw-bold';
      case 'MEDIUM': return 'text-warning fw-bold';
      case 'LOW': return 'text-info fw-bold';
      default: return 'text-secondary';
    }
  }

  openSupportModal(): void {
    this.supportFormError = '';
    this.supportFormSuccess = '';
    this.selectedFile = null;
    this.fileError = '';
    this.supportForm.reset({ issueCategory: '', issueType: '', issueSubject: '', bookingReference: '', issueDescription: '' });
    this.showSupportModal = true;
    this.cdr.markForCheck();
  }

  closeSupportModal(): void {
    this.showSupportModal = false;
    this.cdr.markForCheck();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate type
      if (!['image/png', 'image/jpeg', 'application/pdf'].includes(file.type)) {
        this.fileError = 'Invalid file type. Only PNG, JPG, and PDF are allowed.';
        this.selectedFile = null;
        input.value = '';
        return;
      }
      
      // Validate size (5 MB)
      if (file.size > 5 * 1024 * 1024) {
        this.fileError = 'File size exceeds 5MB limit.';
        this.selectedFile = null;
        input.value = '';
        return;
      }
      
      this.fileError = '';
      this.selectedFile = file;
    }
  }

  submitSupportTicket(): void {
    this.supportForm.markAllAsTouched();
    this.supportFormError = '';
    this.supportFormSuccess = '';

    if (this.supportForm.invalid) {
      return;
    }

    const payload = this.supportForm.value;
    
    const formData = new FormData();
    formData.append('issueCategory', payload.issueCategory);
    formData.append('issueType', payload.issueType);
    formData.append('issueSubject', payload.issueSubject);
    formData.append('issueDescription', payload.issueDescription);
    formData.append('operatorId', ''); 
    if (payload.bookingReference) {
      formData.append('bookingReference', payload.bookingReference);
    }
    
    if (this.selectedFile) {
      formData.append('attachment', this.selectedFile);
    }

    this.supportTicketService.createTicket(formData).subscribe({
      next: (ticket) => {
        this.supportFormSuccess = 'Ticket created successfully!';
        this.fetchMyTickets();
        
        // Auto-close modal on success after a short delay so user sees the message
        setTimeout(() => {
          this.closeSupportModal();
        }, 1500);
      },
      error: (err) => {
        this.supportFormError = err.error?.message || 'Failed to create ticket.';
        this.cdr.markForCheck();
      }
    });
  }

  setBookingTab(tab: 'UPCOMING' | 'COMPLETED' | 'CANCELLED'): void {
    this.bookingTab = tab;
    this.cdr.markForCheck();
  }

  // --- PROFILE SETTINGS ---

  fetchMyProfile(): void {
    this.userService.getMyProfile().subscribe({
      next: (profile) => {
        this.myProfile = profile;
        this.profileForm.patchValue({
          userName: profile.userName,
          mobileNumber: profile.mobileNumber
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.cdr.markForCheck();
      }
    });
  }

  updateProfile(): void {
    this.profileForm.markAllAsTouched();
    this.profileUpdateError = '';
    this.profileUpdateSuccess = '';

    if (this.profileForm.invalid) {
      return;
    }

    const payload = this.profileForm.value;
    this.userService.updateMyProfile(payload).subscribe({
      next: (updated) => {
        this.myProfile = updated;
        this.profileUpdateSuccess = 'Profile updated successfully.';
        setTimeout(() => this.profileUpdateSuccess = '', 3000);
      },
      error: (err) => {
        this.profileUpdateError = err.error?.message || 'Failed to update profile.';
      }
    });
  }

  changePassword(): void {
    this.passwordForm.markAllAsTouched();
    this.passwordError = '';
    this.passwordSuccess = '';

    if (this.passwordForm.invalid) {
      return;
    }

    const payload = this.passwordForm.value;
    this.userService.changePassword(payload).subscribe({
      next: () => {
        this.passwordSuccess = 'Password changed successfully.';
        this.passwordForm.reset();
        setTimeout(() => this.passwordSuccess = '', 3000);
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Failed to change password.';
      }
    });
  }

  // --- REVIEWS ---

  fetchMyReviews(): void {
    this.reviewService.getMyReviews().subscribe({
      next: (reviews) => {
        this.reviewsByBookingId = {};
        reviews.forEach(r => {
          this.reviewsByBookingId[r.bookingId] = r;
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to fetch reviews', err);
        this.cdr.markForCheck();
      }
    });
  }

  openReviewModal(bookingId: string): void {
    this.selectedBookingIdForReview = bookingId;
    this.reviewError = '';
    const existingReview = this.reviewsByBookingId[bookingId];
    if (existingReview) {
      this.isEditingReview = true;
      this.reviewForm = { rating: existingReview.rating, comment: existingReview.comment || '' };
    } else {
      this.isEditingReview = false;
      this.reviewForm = { rating: 5, comment: '' };
    }
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedBookingIdForReview = null;
  }

  setRating(stars: number): void {
    this.reviewForm.rating = stars;
  }

  submitReview(): void {
    if (!this.selectedBookingIdForReview) return;
    this.reviewError = '';

    const req = { ...this.reviewForm };
    if (!req.rating || req.rating < 1 || req.rating > 5) {
      this.reviewError = 'Please select a valid rating between 1 and 5 stars.';
      return;
    }

    if (this.isEditingReview) {
      this.reviewService.updateReview(this.selectedBookingIdForReview, req).subscribe({
        next: (review) => {
          this.reviewsByBookingId[review.bookingId] = review;
          this.closeReviewModal();
        },
        error: (err) => {
          this.reviewError = err.error?.message || 'Failed to update review.';
        }
      });
    } else {
      this.reviewService.createReview(this.selectedBookingIdForReview, req).subscribe({
        next: (review) => {
          this.reviewsByBookingId[review.bookingId] = review;
          this.closeReviewModal();
        },
        error: (err) => {
          this.reviewError = err.error?.message || 'Failed to submit review.';
        }
      });
    }
  }

  // --- BOOKINGS ---
  
  fetchMyBookings(): void {
    this.loadingBookings = true;
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.processBookings(bookings);
      },
      error: (err) => {
        console.error('Error fetching bookings', err);
        this.loadingBookings = false;
        this.cdr.markForCheck();
      }
    });
  }

  viewBookingDetails(bookingId: string): void {
    this.bookingDetailsError = '';
    this.selectedBookingDetails = this.myRawBookings.find(b => b.bookingId === bookingId) || null;
    this.selectedBookingCancellation = null;
    
    if (this.selectedBookingDetails) {
      if (this.selectedBookingDetails.bookingStatus === 'CANCELLED' || this.selectedBookingDetails.bookingStatus === 'FAILED') {
        this.bookingDetailsLoading = true;
        this.cancellationService.getCancellationByBooking(bookingId).subscribe({
          next: (cancellation) => {
            this.selectedBookingCancellation = cancellation;
            this.bookingDetailsLoading = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error fetching cancellation details', err);
            // It's possible a FAILED booking doesn't have a cancellation record yet.
            this.bookingDetailsLoading = false;
            this.cdr.markForCheck();
          }
        });
      } else {
        this.cdr.markForCheck();
      }
    }
  }

  closeBookingDetails(): void {
    this.selectedBookingDetails = null;
    this.selectedBookingCancellation = null;
    this.cdr.markForCheck();
  }

  processBookings(bookings: Booking[]): void {
    this.myRawBookings = bookings;
    
    if (!bookings || bookings.length === 0) {
      this.upcomingBookings = [];
      this.completedBookings = [];
      this.cancelledBookings = [];
      this.loadingBookings = false;
      this.cdr.markForCheck();
      return;
    }

    const tripRequests = bookings.map(b => 
      this.tripService.getTripById(b.tripId).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(tripRequests).subscribe(tripResponses => {
      const uiBookings: UIBooking[] = bookings.map((b, index) => {
        const tripRes = tripResponses[index];
        const trip: TripDTO | null = tripRes ? tripRes.data : null;

        const travelDate = trip?.travelDate ? new Date(trip.travelDate) : null;
        
        let canCancel = false;
        if (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING') {
          if (travelDate && trip?.departureTime) {
            const [hours, minutes] = trip.departureTime.split(':').map(Number);
            const departureDateTime = new Date(travelDate);
            departureDateTime.setHours(hours, minutes, 0, 0);
            
            const now = new Date();
            const diffHours = (departureDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            canCancel = diffHours > 2;
          } else {
            canCancel = true;
          }
        }
        
        return {
          bookingId: b.bookingId,
          bookingReference: b.bookingReference,
          status: b.bookingStatus,
          from: b.boardingPointName || trip?.source || 'Unknown',
          to: b.droppingPointName || trip?.destination || 'Unknown',
          operator: trip?.operatorName || 'Unknown Operator',
          fare: b.totalAmount,
          date: travelDate,
          time: trip?.departureTime || '',
          seats: b.bookingSeats?.map(s => s.seatNumber) || [],
          isCompletedJourney: false,
          canCancel: canCancel,
          isStarted: false,
          segments: trip?.segments || []
        };
      });

      const now = new Date();

      uiBookings.forEach(b => {
        let isCompleted = false;
        
        // Find the trip data for this booking
        const tripIndex = bookings.findIndex(bk => bk.bookingId === b.bookingId);
        const tripRes = tripIndex !== -1 ? tripResponses[tripIndex] : null;
        const trip: TripDTO | null = tripRes ? tripRes.data : null;

        let isStarted = false;

        if (trip?.arrivalDate && trip?.arrivalTime) {
          const [arrHours, arrMinutes] = trip.arrivalTime.split(':').map(Number);
          const arrivalDateTime = new Date(trip.arrivalDate);
          arrivalDateTime.setHours(arrHours, arrMinutes, 0, 0);
          isCompleted = arrivalDateTime < now;
        } else if (trip?.travelDate && trip?.departureTime) {
          // Fallback to departure time if arrival time is missing
          const [depHours, depMinutes] = trip.departureTime.split(':').map(Number);
          const departureDateTime = new Date(trip.travelDate);
          departureDateTime.setHours(depHours, depMinutes, 0, 0);
          // Add a generous 12 hours buffer for trip duration if arrival is unknown
          departureDateTime.setHours(departureDateTime.getHours() + 12);
          isCompleted = departureDateTime < now;
        } else if (b.date) {
          // Ultimate fallback to just the date (end of day)
          const fallbackDate = new Date(b.date);
          fallbackDate.setHours(23, 59, 59, 999);
          isCompleted = fallbackDate < now;
        }

        if (trip?.travelDate && trip?.departureTime) {
          const [depHours, depMinutes] = trip.departureTime.split(':').map(Number);
          const departureDateTime = new Date(trip.travelDate);
          departureDateTime.setHours(depHours, depMinutes, 0, 0);
          isStarted = departureDateTime <= now;
        }

        b.isCompletedJourney = b.status === 'CONFIRMED' && isCompleted;
        b.isStarted = b.status === 'CONFIRMED' && isStarted;
      });

      this.upcomingBookings = uiBookings.filter(b => b.status === 'CONFIRMED' && !b.isCompletedJourney);
      this.completedBookings = uiBookings.filter(b => b.status === 'CONFIRMED' && b.isCompletedJourney);
      this.cancelledBookings = uiBookings.filter(b => b.status === 'CANCELLED' || b.status === 'FAILED');

      // Calculate travel stats (mock data based on completed bookings)
      this.totalDistance = this.completedBookings.length * 320; // Assume 320km per trip
      this.carbonSavings = this.totalDistance * 0.12; // Assume 0.12kg CO2 saved per km

      this.loadingBookings = false;
      this.cdr.markForCheck();
    });
  }

  cancelBooking(bookingId: string): void {
    this.selectedBookingIdToCancel = bookingId;
    this.cancelReason = '';
    this.cancelError = '';
    this.cancellationEstimate = null;
    
    this.cancellationService.getCancellationEstimate(bookingId).subscribe({
      next: (estimate) => {
        this.cancellationEstimate = estimate;
        this.showCancelConfirmModal = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cancelError = err.error?.message || 'Failed to fetch cancellation estimate. It may be too late to cancel.';
        this.cdr.markForCheck();
      }
    });
  }

  confirmCancelBooking(): void {
    if (!this.selectedBookingIdToCancel) return;

    this.showCancelConfirmModal = false;
    this.loadingBookings = true;

    this.cancellationService.cancelBooking(this.selectedBookingIdToCancel, { cancellationReason: this.cancelReason || 'User requested cancellation' }).subscribe({
      next: (res) => {
        this.cancellationResult = res;
        this.showCancelResultModal = true;
        this.fetchMyBookings();
      },
      error: (err) => {
        this.cancelError = err.error?.message || 'Failed to cancel booking. It may be too late to cancel.';
        this.loadingBookings = false;
      }
    });
  }

  closeCancelResultModal(): void {
    this.showCancelResultModal = false;
    this.cancellationResult = null;
  }

  closeCancelConfirmModal(): void {
    this.showCancelConfirmModal = false;
    this.selectedBookingIdToCancel = null;
    this.cancellationEstimate = null;
  }

  // --- TRACKING ---
  
  openTrackingModal(booking: UIBooking): void {
    this.trackingBooking = booking;
    this.showTrackingModal = true;
    this.cdr.markForCheck();
  }
  
  closeTrackingModal(): void {
    this.showTrackingModal = false;
    this.trackingBooking = null;
    this.cdr.markForCheck();
  }

  viewTicket(bookingReference: string): void {
    this.router.navigate(['/ticket'], { queryParams: { bookingReference } });
  }

  // --- SAVED PASSENGERS ---

  fetchSavedPassengers(): void {
    this.loadingPassengers = true;
    this.savedPassengerService.getMySavedPassengers().subscribe({
      next: (passengers) => {
        this.savedPassengers = passengers.filter(p => p.isActive);
        this.loadingPassengers = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading passengers', err);
        this.loadingPassengers = false;
        this.cdr.markForCheck();
      }
    });
  }

  openPassengerModal(passenger?: SavedPassengerDTO): void {
    this.passengerError = '';
    if (passenger) {
      this.editingPassengerId = passenger.savedPassengerId;
      this.passengerForm = {
        passengerName: passenger.passengerName,
        age: passenger.age,
        gender: passenger.gender,
        idType: passenger.idType || '',
        idNumber: passenger.idNumber || '',
        contactNumber: passenger.contactNumber || ''
      };
    } else {
      this.editingPassengerId = null;
      this.passengerForm = {
        passengerName: '',
        age: 0,
        gender: 'MALE',
        idType: '',
        idNumber: '',
        contactNumber: ''
      };
    }
    this.showPassengerModal = true;
    this.cdr.markForCheck();
  }

  closePassengerModal(): void {
    this.showPassengerModal = false;
    this.cdr.markForCheck();
  }

  savePassenger(): void {
    this.passengerError = '';
    
    // Basic validation
    if (!this.passengerForm.passengerName.trim() || !this.passengerForm.age || !this.passengerForm.gender) {
      this.passengerError = 'Name, Age, and Gender are required.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.passengerForm.idType || !['AADHAAR', 'PAN'].includes(this.passengerForm.idType)) {
      this.passengerError = 'Please select a valid ID Type (Aadhaar or PAN).';
      this.cdr.markForCheck();
      return;
    }

    if (!this.passengerForm.idNumber || !this.passengerForm.idNumber.trim()) {
      this.passengerError = 'ID Number is required.';
      this.cdr.markForCheck();
      return;
    }

    if (this.passengerForm.idType === 'AADHAAR') {
      const aadhaarRegex = /^[2-9]{1}[0-9]{11}$/;
      if (!aadhaarRegex.test(this.passengerForm.idNumber)) {
        this.passengerError = 'Invalid Aadhaar Number. Must be 12 digits and cannot start with 0 or 1.';
        this.cdr.markForCheck();
        return;
      }
      if (/^([0-9])\1{11}$/.test(this.passengerForm.idNumber)) {
        this.passengerError = 'Invalid Aadhaar Number. Cannot contain continuous identical digits.';
        this.cdr.markForCheck();
        return;
      }
    } else if (this.passengerForm.idType === 'PAN') {
      const panRegex = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/;
      if (!panRegex.test(this.passengerForm.idNumber)) {
        this.passengerError = 'Invalid PAN Number. Format: 5 letters, 4 digits, 1 letter.';
        this.cdr.markForCheck();
        return;
      }
    }

    if (this.editingPassengerId) {
      this.savedPassengerService.updateSavedPassenger(this.editingPassengerId, this.passengerForm).subscribe({
        next: () => {
          this.fetchSavedPassengers();
          this.closePassengerModal();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.passengerError = err.error?.message || 'Failed to update passenger.';
          this.cdr.markForCheck();
        }
      });
    } else {
      this.savedPassengerService.createSavedPassenger(this.passengerForm).subscribe({
        next: () => {
          this.fetchSavedPassengers();
          this.closePassengerModal();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.passengerError = err.error?.message || 'Failed to save passenger.';
          this.cdr.markForCheck();
        }
      });
    }
  }

  deletePassenger(savedPassengerId: string): void {
    this.confirmService.confirm('Are you sure you want to remove this saved passenger?').subscribe(confirmed => {
      if (confirmed) {
        this.savedPassengerService.deactivateSavedPassenger(savedPassengerId).subscribe({
          next: () => {
            this.fetchSavedPassengers();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to delete passenger', err);
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  // --- SUPPORT TICKET REPLIES ---
  viewTicketThread(ticketId: string): void {
    this.ticketThreadLoading = true;
    this.selectedTicketThread = null;
    this.supportTicketService.getTicketWithMessages(ticketId).subscribe({
      next: (ticket) => {
        this.selectedTicketThread = ticket;
        this.ticketThreadLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load ticket', err);
        this.ticketThreadLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  closeTicketThread(): void {
    this.selectedTicketThread = null;
    this.cdr.markForCheck();
  }

  replyToTicket(): void {
    if (!this.selectedTicketThread || !this.replyMessage.trim()) return;
    this.replyLoading = true;
    
    this.supportTicketService.addMessage(this.selectedTicketThread.ticketId, {
      message: this.replyMessage,
      isInternal: false
    }).subscribe({
      next: (msg) => {
        if (this.selectedTicketThread) {
          this.selectedTicketThread.messages.push(msg);
        }
        this.replyMessage = '';
        this.replyLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error replying to ticket', err);
        this.replyLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
