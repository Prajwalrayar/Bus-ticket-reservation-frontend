import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Bus } from '../../../core/models/bus';
import { Passenger } from '../../../core/models/passenger';
import { TripSeatDTO as Seat } from '../../../core/models/seat';
import { BusService } from '../../../core/services/bus.service';
import { BookingStateService } from '../../../core/services/booking-state.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { BookingService } from '../../../core/services/booking.service';
import { User } from '../../../core/models/user';
import { OfferService } from '../../../core/services/offer.service';
import { Offer } from '../../../core/models/offer';
import { BookingCreateRequest } from '../../../core/models/booking';

@Component({
  selector: 'app-booking-confirmation',
  standalone: false,
  templateUrl: './booking-confirmation.component.html',
  styleUrl: './booking-confirmation.component.css',
})
export class BookingConfirmationComponent implements OnInit, OnDestroy {

  // ==========================================================
  // BUS
  // ==========================================================

  bus = signal<Bus | null>(null);


  // ==========================================================
  // PASSENGERS
  // ==========================================================

  passengers = signal<Passenger[]>([]);


  // ==========================================================
  // SELECTED SEATS
  // ==========================================================

  selectedSeats = signal<Seat[]>([]);


  // ==========================================================
  // JOURNEY DATE
  // ==========================================================

  journeyDate = signal('');

  boardingPointId = signal('');
  droppingPointId = signal('');

  // ==========================================================
  // UI STATE
  // ==========================================================

  loading = signal(false);

  errorMessage = signal('');


  // ==========================================================
  // OFFER CAROUSEL
  // ==========================================================

  selectedOfferIndex = signal(0);

  private offerInterval:
    ReturnType<typeof setInterval> | null = null;


  // ==========================================================
  // COUPON / OFFER STATE
  // ==========================================================

  couponExpanded = false;

  couponCode = '';

  couponError = '';

  appliedOfferCode = '';

  discountAmount = 0;


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor(

    private route: ActivatedRoute,

    private router: Router,

    private busService: BusService,

    private bookingStateService: BookingStateService,

    private authStateService: AuthStateService,

    private bookingService: BookingService,

    private offerService: OfferService

  ) { }


  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  ngOnInit(): void {


    // ========================================================
    // GET PASSENGER DETAILS
    // ========================================================

    this.passengers.set(
      this.bookingStateService.getPassengers()
    );


    // ========================================================
    // GET QUERY PARAMETERS
    // ========================================================

    this.route.queryParams.subscribe(params => {

      const tripId =
        params['tripId'] || '';

      const date =
        params['date'] || '';

      const seatsParam =
        params['seats'] || '';

      const boardingPointId = params['boardingPointId'] || '';
      const droppingPointId = params['droppingPointId'] || '';

      this.journeyDate.set(date);
      this.boardingPointId.set(boardingPointId);
      this.droppingPointId.set(droppingPointId);

      // ------------------------------------------------------
      // VALIDATE BUS
      // ------------------------------------------------------

      if (!tripId) {

        this.errorMessage.set(
          'Bus information is missing.'
        );

        return;
      }


      // ------------------------------------------------------
      // LOAD BUS
      // ------------------------------------------------------

      this.loadBus(tripId);


      // ------------------------------------------------------
      // LOAD SELECTED SEATS
      // ------------------------------------------------------

      if (seatsParam) {

        const seatNumbers =
          seatsParam.split(',');


        this.loadSeats(
          tripId,
          seatNumbers
        );

      }

    });


    // ========================================================
    // START OFFER CAROUSEL
    // ========================================================

    this.startOfferCarousel();

  }


  // ==========================================================
  // LOAD BUS
  // ==========================================================

  loadBus(tripId: string): void {

    this.loading.set(true);


    this.busService
      .getTripById(tripId)
      .subscribe({

        next: (bus) => {

          this.bus.set(bus);

          this.loading.set(false);

        },


        error: (error) => {

          console.error(
            'Unable to load bus:',
            error
          );

          this.loading.set(false);

          this.errorMessage.set(
            'Unable to load bus details.'
          );

        }

      });

  }


  // ==========================================================
  // LOAD SELECTED SEATS
  // ==========================================================

  loadSeats(
    tripId: string,
    seatNumbers: string[]
  ): void {


    this.busService
      .getSeatsByTripId(tripId)
      .subscribe({

        next: (seats) => {

          const selected =
            seats.filter(seat =>
              seatNumbers.includes(
                seat.seatNumber
              )
            );


          this.selectedSeats.set(
            selected
          );

        },


        error: (error) => {

          console.error(
            'Unable to load seats:',
            error
          );


          this.errorMessage.set(
            'Unable to load selected seats.'
          );

        }

      });

  }


  // ==========================================================
  // BASE AMOUNT
  // ==========================================================

  getBaseAmount(): number {

    const currentBus =
      this.bus();


    if (!currentBus) {

      return 0;

    }


    return (
      this.selectedSeats().length *
      currentBus.baseFare
    );

  }


  // ==========================================================
  // TOTAL AMOUNT
  // ==========================================================

  getTotalAmount(): number {

    const baseAmount =
      this.getBaseAmount();


    return Math.max(
      0,
      baseAmount - this.discountAmount
    );

  }


  // ==========================================================
  // CURRENT USER
  // ==========================================================

  currentUser(): User | null {

    return this.authStateService.getUser();

  }


  // ==========================================================
  // GET OFFERS
  // ==========================================================

  getOffers() {

    // Guest user should not see offers

    if (!this.authStateService.isLoggedIn()) {

      return [];

    }


    return this.offerService.getOffers();

  }


  // ==========================================================
  // APPLY OFFER
  // ==========================================================

  applyOffer(offer: Offer): void {

    const baseAmount =
      this.getBaseAmount();


    this.appliedOfferCode =
      offer.code;


    this.couponCode = '';

    this.couponError = '';


    // IMPORTANT:
    // Store the returned discount amount
    this.discountAmount =
      this.offerService.calculateDiscount(
        offer,
        baseAmount
      );

  }


  // ==========================================================
  // REMOVE OFFER
  // ==========================================================

  removeOffer(): void {

    this.appliedOfferCode = '';

    this.discountAmount = 0;

    this.couponCode = '';

    this.couponError = '';

  }


  // ==========================================================
  // TOGGLE COUPON
  // ==========================================================

  toggleCoupon(): void {

    this.couponExpanded =
      !this.couponExpanded;

    this.couponError = '';

  }


  // ==========================================================
  // APPLY COUPON
  // ==========================================================

  applyCoupon(): void {

    const code =
      this.couponCode
        .trim()
        .toUpperCase();


    // ==========================================================
    // CHECK EMPTY COUPON
    // ==========================================================

    if (!code) {

      this.couponError =
        'Please enter a coupon code.';

      return;

    }


    // ==========================================================
    // FIND OFFER
    // ==========================================================

    const offer =
      this.offerService.getOfferByCode(code);


    // ==========================================================
    // INVALID COUPON
    // ==========================================================

    if (!offer) {

      this.appliedOfferCode = '';

      this.discountAmount = 0;

      this.couponError =
        'Invalid coupon code. Please try again.';

      return;

    }


    // ==========================================================
    // APPLY OFFER
    // ==========================================================

    const baseAmount =
      this.getBaseAmount();


    this.appliedOfferCode =
      offer.code;


    this.discountAmount =
      this.offerService.calculateDiscount(
        offer,
        baseAmount
      );


    this.couponError = '';

  }

  // ==========================================================
  // START AUTO OFFER CAROUSEL
  // ==========================================================

  startOfferCarousel(): void {

    // Clear existing interval first

    this.stopOfferCarousel();


    this.offerInterval =
      setInterval(() => {

        const offers =
          this.getOffers();


        // No offers for guest

        if (offers.length === 0) {

          return;

        }


        this.selectedOfferIndex.update(
          index =>
            (index + 1) % offers.length
        );


      }, 4000);

  }


  // ==========================================================
  // STOP OFFER CAROUSEL
  // ==========================================================

  stopOfferCarousel(): void {

    if (
      this.offerInterval !== null
    ) {

      clearInterval(
        this.offerInterval
      );


      this.offerInterval = null;

    }

  }


  // ==========================================================
  // RESTART CAROUSEL
  // ==========================================================

  restartOfferCarousel(): void {

    this.stopOfferCarousel();

    this.startOfferCarousel();

  }


  // ==========================================================
  // PREVIOUS OFFER
  // ==========================================================

  previousOffer(): void {

    const offers =
      this.getOffers();


    if (offers.length === 0) {

      return;

    }


    this.selectedOfferIndex.update(
      index =>
        (
          index - 1 + offers.length
        ) % offers.length
    );


    this.restartOfferCarousel();

  }


  // ==========================================================
  // NEXT OFFER
  // ==========================================================

  nextOffer(): void {

    const offers =
      this.getOffers();


    if (offers.length === 0) {

      return;

    }


    this.selectedOfferIndex.update(
      index =>
        (
          index + 1
        ) % offers.length
    );


    this.restartOfferCarousel();

  }


  // ==========================================================
  // SELECT OFFER USING DOT
  // ==========================================================

  selectOffer(index: number): void {

    const offers =
      this.getOffers();


    if (
      index < 0 ||
      index >= offers.length
    ) {

      return;

    }


    this.selectedOfferIndex.set(index);

    this.restartOfferCarousel();

  }


  // ==========================================================
  // GO BACK
  // ==========================================================

  goBack(): void {

    const currentBus =
      this.bus();


    if (!currentBus) {

      this.router.navigate(['/']);

      return;

    }


    this.router.navigate(
      ['/seat-selection'],
      {
        queryParams: {

          tripId:
            currentBus.tripId,

          date:
            this.journeyDate()

        }
      }
    );

  }





  // ==========================================================
  // CONFIRM BOOKING
  // ==========================================================

  confirmBooking(): void {

    this.errorMessage.set('');


    // ==========================================================
    // GET LOGGED-IN USER
    // ==========================================================

    const currentUser =
      this.authStateService.getUser();


    // ==========================================================
    // GET BUS
    // ==========================================================

    const currentBus =
      this.bus();


    // ==========================================================
    // VALIDATE BUS
    // ==========================================================

    if (!currentBus) {

      this.errorMessage.set(
        'Bus information is missing.'
      );

      return;

    }


    // ==========================================================
    // VALIDATE SELECTED SEATS
    // ==========================================================

    if (this.selectedSeats().length === 0) {

      this.errorMessage.set(
        'No seats have been selected.'
      );

      return;

    }


    // ==========================================================
    // CREATE BOOKING REQUEST
    // ==========================================================

    const bookingRequest: BookingCreateRequest = {

      tripId:
        currentBus.tripId,

      boardingPointId:
        this.boardingPointId(),

      droppingPointId:
        this.droppingPointId(),

      passengers:
        this.passengers(),

      offerCode:
        this.appliedOfferCode || undefined,

      isInsured:
        false // Based on UI logic, could add a checkbox later

    };


    // ==========================================================
    // SAVE BOOKING
    // ==========================================================

    this.loading.set(true);


    this.bookingService
      .createBooking(bookingRequest)
      .subscribe({

        // ========================================================
        // SUCCESS
        // ========================================================

        next: (savedBooking) => {

          console.log(
            'Booking created:',
            savedBooking
          );


          this.loading.set(false);


          // ======================================================
          // GO TO BOOKING SUCCESS
          // ======================================================

          this.router.navigate(
            ['/payment'],
            {
              queryParams: {

                bookingId:
                  savedBooking.bookingId

              }
            }
          );

        },


        // ========================================================
        // ERROR
        // ========================================================

        error: (error) => {

          console.error(
            'Unable to create booking:',
            error
          );


          this.loading.set(false);


          this.errorMessage.set(
            'Unable to confirm booking. Please try again.'
          );

        }

      });

  }


  // ==========================================================
  // EDIT PASSENGER DETAILS
  // ==========================================================

  editPassengerDetails(): void {

    const currentBus =
      this.bus();


    if (!currentBus) {

      return;

    }


    this.router.navigate(
      ['/passenger-details'],
      {
        queryParams: {

          tripId:
            currentBus.tripId,

          from:
            currentBus.source,

          to:
            currentBus.destination,

          date:
            this.journeyDate(),

          seats:
            this.selectedSeats()
              .map(
                seat =>
                  seat.seatNumber
              )
              .join(',')

        }
      }
    );

  }


  // ==========================================================
  // GO TO LOGIN
  // ==========================================================

  goToLogin(): void {

    this.router.navigate(
      ['/login'],
      {
        queryParams: {

          returnUrl:
            this.router.url

        }
      }
    );

  }


  // ==========================================================
  // COMPONENT DESTROY
  // ==========================================================

  ngOnDestroy(): void {

    this.stopOfferCarousel();

  }

}
