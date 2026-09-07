import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { TripService } from '../../../core/services/trip.service';
import { CancellationService } from '../../../core/services/cancellation.service';
import { SavedPassengerService } from '../../../core/services/saved-passenger.service';
import { ReviewService } from '../../../core/services/review.service';
import { Booking } from '../../../core/models/booking';
import { TripDTO } from '../../../core/models/trip';
import { CancellationDTO } from '../../../core/models/cancellation';
import { SavedPassengerDTO, SavedPassengerRequest } from '../../../core/models/saved-passenger';
import { ReviewDTO, ReviewCreateRequest } from '../../../core/models/review';
import { UserService } from '../../../core/services/user.service';
import { UserDTO } from '../../../core/models/user';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CustomValidators } from '../../../core/validators/custom-validators';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ThemeService } from '../../../core/services/theme.service';

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
}

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  activeTab: 'BOOKINGS' | 'PASSENGERS' | 'SETTINGS' = 'BOOKINGS';

  upcomingBookings: UIBooking[] = [];
  completedBookings: UIBooking[] = [];
  cancelledBookings: UIBooking[] = [];

  savedPassengers: SavedPassengerDTO[] = [];
  reviewsByBookingId: { [bookingId: string]: ReviewDTO } = {};

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

  // Saved Passenger State
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
  showReviewModal: boolean = false;
  selectedBookingIdForReview: string | null = null;
  reviewForm: ReviewCreateRequest = { rating: 5, comment: '' };
  reviewError: string = '';
  isEditingReview: boolean = false;

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
    public themeService: ThemeService
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

    this.fetchMyProfile();
    this.fetchMyReviews();
    this.fetchMyBookings();
  }

  setTab(tab: 'BOOKINGS' | 'PASSENGERS' | 'SETTINGS'): void {
    this.activeTab = tab;
    if (tab === 'PASSENGERS') {
      this.fetchSavedPassengers();
    }
    // Profile is already fetched on init
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
      },
      error: (err) => console.error('Failed to load profile', err)
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
      },
      error: (err) => console.error('Failed to fetch reviews', err)
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
      }
    });
  }

  processBookings(bookings: Booking[]): void {
    if (!bookings || bookings.length === 0) {
      this.upcomingBookings = [];
      this.completedBookings = [];
      this.cancelledBookings = [];
      this.loadingBookings = false;
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
          seats: b.bookingSeats?.map(s => s.seatNumber) || []
        };
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      this.upcomingBookings = uiBookings.filter(b => b.status === 'CONFIRMED' && b.date && b.date >= today);
      this.completedBookings = uiBookings.filter(b => b.status === 'CONFIRMED' && b.date && b.date < today);
      this.cancelledBookings = uiBookings.filter(b => b.status === 'CANCELLED' || b.status === 'EXPIRED');

      this.loadingBookings = false;
    });
  }

  cancelBooking(bookingId: string): void {
    this.selectedBookingIdToCancel = bookingId;
    this.cancelReason = '';
    this.showCancelConfirmModal = true;
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
      },
      error: (err) => {
        console.error('Failed to fetch saved passengers', err);
        this.loadingPassengers = false;
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
  }

  closePassengerModal(): void {
    this.showPassengerModal = false;
  }

  savePassenger(): void {
    this.passengerError = '';
    
    // Basic validation
    if (!this.passengerForm.passengerName.trim() || !this.passengerForm.age || !this.passengerForm.gender) {
      this.passengerError = 'Name, Age, and Gender are required.';
      return;
    }

    if (this.editingPassengerId) {
      this.savedPassengerService.updateSavedPassenger(this.editingPassengerId, this.passengerForm).subscribe({
        next: () => {
          this.fetchSavedPassengers();
          this.closePassengerModal();
        },
        error: (err) => {
          this.passengerError = err.error?.message || 'Failed to update passenger.';
        }
      });
    } else {
      this.savedPassengerService.createSavedPassenger(this.passengerForm).subscribe({
        next: () => {
          this.fetchSavedPassengers();
          this.closePassengerModal();
        },
        error: (err) => {
          this.passengerError = err.error?.message || 'Failed to save passenger.';
        }
      });
    }
  }

  deletePassenger(savedPassengerId: string): void {
    if (confirm('Are you sure you want to remove this saved passenger?')) {
      this.savedPassengerService.deactivateSavedPassenger(savedPassengerId).subscribe({
        next: () => {
          this.fetchSavedPassengers();
        },
        error: (err) => {
          console.error('Failed to delete passenger', err);
        }
      });
    }
  }
}

