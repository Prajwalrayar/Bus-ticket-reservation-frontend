import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { OperatorService } from '../../../core/services/operator.service';
import { OperatorDTO } from '../../../core/models/operator';
import { BusService } from '../../../core/services/bus.service';
import { BusDTO, BusCreateRequest, BusSeatDTO, BusSeatCreateRequest } from '../../../core/models/bus';
import { TripService } from '../../../core/services/trip.service';
import { TripDTO, TripSearchRequest, TripCreateRequest } from '../../../core/models/trip';
import { RouteDTO } from '../../../core/models/route';
import { RouteService } from '../../../core/services/route.service';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../../core/models/api-response';
import { AiService } from '../../../core/services/ai.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-operator-dashboard',
  standalone: false,
  templateUrl: './operator-dashboard.component.html',
  styleUrl: './operator-dashboard.component.css',
})
export class OperatorDashboardComponent implements OnInit {

  activeTab: 'COMPANY_PROFILE' | 'FLEET' | 'ROUTES' | 'TICKETS' | 'TRIPS' | 'SUPPORT_AGENTS' = 'COMPANY_PROFILE';
  
  companyNameInput: string = '';
  isSetupComplete: boolean = false;
  operatorProfile: OperatorDTO | null = null;
  profileError: string = '';

  // Utility — dates for [min] and [max]
  today = new Date().toISOString().split('T')[0];
  maxDate = new Date(new Date().setDate(new Date().getDate() + 45)).toISOString().split('T')[0];

  get minTripDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }

  get maxTripDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().split('T')[0];
  }

  dayOptions: number[] = [0, 1, 2, 3, 4, 5, 6];

  // ROUTES
  routes: RouteDTO[] = [];
  routesLoading: boolean = false;

  // FLEET
  buses: BusDTO[] = [];
  busesLoading: boolean = false;
  
  showBusModal: boolean = false;
  isEditingBus: boolean = false;
  busForm: BusCreateRequest = {
    registrationNumber: '',
    busType: 'SEATER',
    operatorCompanyName: '',
    amenities: [],
    petsAllowed: false,
    baggagePolicy: 'Only 2 bags up to 50-80 kgs are allowed.'
  };
  busAmenitiesStr: string = '';
  busSubmitSuccess: string = '';
  busSubmitError: string = '';

  // SEATS
  showSeatModal: boolean = false;
  selectedBusForSeats: BusDTO | null = null;
  busSeats: BusSeatDTO[] = [];
  seatsLoading: boolean = false;
  isEditingSeat: boolean = false;
  originalSeatNumber: string = '';
  seatForm: BusSeatCreateRequest = {
    seatNumber: '',
    seatPosition: 'UPPER'
  };
  seatSubmitSuccess: string = '';
  seatSubmitError: string = '';
  isConfiguringSeats: boolean = false;

  // TRIP ASSIGNMENT MODAL (from fleet)
  showTripModal: boolean = false;
  selectedBusForTrip: BusDTO | null = null;
  tripForm: TripCreateRequest = {
    busRegistrationNumber: '',
    source: '',
    destination: '',
    travelDate: '',
    arrivalDate: '',
    departureTime: '',
    arrivalTime: '',
    baseFare: 0
  };
  tripSubmitSuccess: string = '';
  tripSubmitError: string = '';
  tripSubmitLoading: boolean = false;
  routeFares: any[] = [];
  isEditingTrip: boolean = false;
  originalTripKeys: any = null;
  selectedRouteId: string = '';

  // ALL TRIPS for operator
  operatorTrips: TripDTO[] = [];

  // TICKETS
  ticketNumberToValidate: string = '';
  ticketValidationMsg: string = '';
  ticketValidationError: string = '';

  // TRIPS SEARCH
  tripSearchForm: TripSearchRequest = {
    source: '',
    destination: ''
  };
  tripSearchResults: TripDTO[] = [];
  tripSearchLoading: boolean = false;

  // AI Insights State
  aiInsights = new Map<string, {
    loading: boolean;
    demand?: any;
    pricing?: any;
    delay?: any;
    error?: string;
  }>();

  // SUPPORT AGENTS
  supportAgentForm = {
    fullName: '',
    email: '',
    mobileNumber: '',
    password: ''
  };
  supportAgentSubmitSuccess: string = '';
  supportAgentSubmitError: string = '';
  supportAgentLoading: boolean = false;
  supportAgents: any[] = [];
  supportAgentsLoading: boolean = false;

  constructor(
    private operatorService: OperatorService,
    private busService: BusService,
    private tripService: TripService,
    private routeService: RouteService,
    private http: HttpClient,
    private aiService: AiService,
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (profile) => {
        if (profile.companyName) {
          this.companyNameInput = profile.companyName;
          this.setupCompany();
        } else {
          this.profileError = 'No operating company assigned to your profile.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.profileError = 'Failed to load user profile.';
        this.cdr.detectChanges();
      }
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.isSetupComplete) {
        this.determineTabFromUrl();
      }
    });
  }

  determineTabFromUrl(): void {
    const url = this.router.url;
    if (url.includes('/operator/buses')) {
      this.setTab('FLEET');
    } else if (url.includes('/operator/routes')) {
      this.setTab('ROUTES');
    } else if (url.includes('/operator/trips')) {
      this.setTab('TRIPS');
    } else if (url.includes('/operator/support-agents')) {
      this.setTab('SUPPORT_AGENTS');
    } else if (url.includes('/operator/bookings')) {
      this.setTab('TICKETS');
    } else {
      this.setTab('COMPANY_PROFILE');
    }
  }

  setupCompany(): void {
    if (!this.companyNameInput) return;
    this.operatorService.getOperatorByCompanyName(this.companyNameInput).subscribe({
      next: (res) => {
        this.operatorProfile = res;
        this.isSetupComplete = true;
        this.determineTabFromUrl();
        this.fetchDashboardStats();
        this.fetchAllOperatorTrips();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.profileError = 'Operator not found or unauthorized.';
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: 'COMPANY_PROFILE' | 'FLEET' | 'ROUTES' | 'TICKETS' | 'TRIPS' | 'SUPPORT_AGENTS'): void {
    this.activeTab = tab;
    if (tab === 'FLEET') {
      this.fetchRoutes();
      this.fetchBuses();
    } else if (tab === 'ROUTES') {
      this.fetchRoutes();
    } else if (tab === 'SUPPORT_AGENTS') {
      // Support agent list loaded fresh each time
    }
  }

  // DASHBOARD STATS
  dashboardBusesCount: number = 0;
  dashboardRoutesCount: number = 0;
  dashboardSupportAgentsCount: number = 2; // Real-world simulation

  fetchDashboardStats(): void {
    if (this.companyNameInput) {
      this.busService.getBusesByOperator(this.companyNameInput).subscribe(res => {
        this.dashboardBusesCount = res.length;
      });
      this.routeService.getAllRoutes().subscribe(res => {
        this.dashboardRoutesCount = res.filter(r => r.isActive).length;
        this.cdr.detectChanges();
      });
      this.fetchSupportAgents();
    }
  }

  fetchSupportAgents(): void {
    this.supportAgentsLoading = true;
    this.http.get<ApiResponse<any[]>>('/api/operators/support-agents').subscribe({
      next: (res) => {
        this.supportAgents = res.data;
        this.dashboardSupportAgentsCount = this.supportAgents.length;
        this.supportAgentsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.supportAgentsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // PROFILE
  saveProfile(): void {
    if (!this.operatorProfile) return;
    this.operatorService.updateOperator(this.companyNameInput, this.operatorProfile).subscribe({
      next: (res) => {
        this.operatorProfile = res;
        this.toastService.success('Profile updated successfully!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.error('Failed to update profile.');
        this.cdr.detectChanges();
      }
    });
  }

  // FLEET
  fetchRoutes(): void {
    this.routesLoading = true;
    this.routeService.getAllRoutes().subscribe({
      next: (res) => {
        this.routes = res.filter(r => r.isActive);
        this.routesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { 
        this.routesLoading = false; 
        this.cdr.detectChanges();
      }
    });
  }

  fetchBuses(): void {
    this.busesLoading = true;
    this.busService.getBusesByOperator(this.companyNameInput).subscribe({
      next: (res) => {
        this.buses = res;
        this.busesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.busesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchAllOperatorTrips(): void {
    if (!this.companyNameInput) return;
    this.http.get<ApiResponse<TripDTO[]>>(`/api/trips/operator`).subscribe({
      next: (res) => {
        this.operatorTrips = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch operator trips for busy check', err);
      }
    });
  }

  isBusBusy(registrationNumber: string): boolean {
    return !!this.getActiveTripForBus(registrationNumber);
  }

  getActiveTripForBus(registrationNumber: string): TripDTO | undefined {
    if (!this.operatorTrips) return undefined;
    const now = new Date();
    const activeTrips = this.operatorTrips.filter(trip => 
      !trip.isCancelled &&
      trip.busRegistrationNumber === registrationNumber &&
      new Date(`${trip.arrivalDate || trip.travelDate}T${trip.arrivalTime}`) > now
    );
    if (activeTrips.length === 0) return undefined;
    
    // Sort by departure time ascending to get the earliest upcoming trip
    activeTrips.sort((a, b) => {
      return new Date(`${a.travelDate}T${a.departureTime}`).getTime() - new Date(`${b.travelDate}T${b.departureTime}`).getTime();
    });
    
    return activeTrips[0];
  }

  openBusModal(bus?: BusDTO): void {
    this.busSubmitError = '';
    this.busSubmitSuccess = '';
    if (bus) {
      this.isEditingBus = true;
      this.busForm = {
        registrationNumber: bus.registrationNumber,
        busType: bus.busType,
        operatorCompanyName: bus.operatorCompanyName,
        amenities: bus.amenities || [],
        petsAllowed: bus.petsAllowed || false,
        baggagePolicy: bus.baggagePolicy || 'Only 2 bags up to 50-80 kgs are allowed.'
      };
    } else {
      this.isEditingBus = false;
      this.busForm = {
        registrationNumber: '',
        busType: 'SEATER',
        operatorCompanyName: this.operatorProfile?.companyName || '',
        amenities: [],
        petsAllowed: false,
        baggagePolicy: 'Only 2 bags up to 50-80 kgs are allowed.'
      };
    }
    this.showBusModal = true;
  }

  closeBusModal(): void {
    this.showBusModal = false;
  }

  saveBus(): void {
    this.busSubmitError = '';
    this.busSubmitSuccess = '';
    const payload: BusCreateRequest = { ...this.busForm };

    if (this.isEditingBus) {
      this.busService.updateBus(payload.registrationNumber, payload).subscribe({
        next: () => {
          this.busSubmitSuccess = 'Bus updated!';
          this.fetchBuses();
          setTimeout(() => this.closeBusModal(), 1500);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.busSubmitError = err.error?.message || 'Error updating bus.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.busService.createBus(payload).subscribe({
        next: () => {
          this.busSubmitSuccess = 'Bus created!';
          this.fetchBuses();
          setTimeout(() => this.closeBusModal(), 1500);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.busSubmitError = err.error?.message || 'Error creating bus.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Activation request state
  showActivationRequestModal: boolean = false;
  activationRequestBus: BusDTO | null = null;
  activationRequestReason: string = '';
  activationRequestLoading: boolean = false;
  activationRequestError: string = '';

  openActivationRequestModal(bus: BusDTO): void {
    this.activationRequestBus = bus;
    this.activationRequestReason = '';
    this.activationRequestError = '';
    this.showActivationRequestModal = true;
    this.cdr.markForCheck();
  }

  closeActivationRequestModal(): void {
    this.showActivationRequestModal = false;
    this.activationRequestBus = null;
    this.activationRequestReason = '';
    this.activationRequestError = '';
    this.cdr.markForCheck();
  }

  submitActivationRequest(): void {
    if (!this.activationRequestBus || !this.activationRequestReason.trim()) {
      this.activationRequestError = 'Please provide a reason for reactivation.';
      this.cdr.markForCheck();
      return;
    }
    this.activationRequestLoading = true;
    this.activationRequestError = '';
    this.busService.requestActivation(this.activationRequestBus.registrationNumber, this.activationRequestReason).subscribe({
      next: () => {
        this.activationRequestLoading = false;
        this.closeActivationRequestModal();
        this.toastService.success('Activation request submitted! Awaiting admin approval.');
        this.fetchAllBuses();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.activationRequestLoading = false;
        this.activationRequestError = err.error?.message || 'Failed to submit request.';
        this.cdr.markForCheck();
      }
    });
  }

  payCompensationAndActivate(bus: BusDTO): void {
    this.busService.createCompensationRazorpayOrder(bus.registrationNumber).subscribe({
      next: (order: any) => {
        // If compensation is 0, bus is already activated
        if (!order.orderId) {
          this.toastService.success('Bus reactivated successfully (no compensation required)!');
          this.fetchAllBuses();
          return;
        }
        const options: any = {
          key: order.keyId,
          amount: order.amount * 100,
          currency: order.currency || 'INR',
          name: 'Bus Reactivation Compensation',
          description: `Compensation for bus ${bus.registrationNumber}`,
          order_id: order.orderId,
          handler: (response: any) => {
            this.busService.verifyCompensationAndActivate(
              bus.registrationNumber,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            ).subscribe({
              next: () => {
                this.toastService.success('Payment successful! Bus has been reactivated.');
                this.fetchAllBuses();
                this.cdr.markForCheck();
              },
              error: (err: any) => {
                this.toastService.error(err.error?.message || 'Payment verification failed.');
                this.cdr.markForCheck();
              }
            });
          },
          theme: { color: '#5c6bc0' }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to initiate compensation payment.');
        this.cdr.markForCheck();
      }
    });
  }

  hasAmenity(amenity: string): boolean {
    return this.busForm.amenities?.includes(amenity) || false;
  }

  toggleAmenity(amenity: string): void {
    if (!this.busForm.amenities) {
      this.busForm.amenities = [];
    }
    const idx = this.busForm.amenities.indexOf(amenity);
    if (idx > -1) {
      this.busForm.amenities.splice(idx, 1);
    } else {
      this.busForm.amenities.push(amenity);
    }
  }
  // TRIP ASSIGNMENT FROM FLEET
  routeStops: import('../../../core/models/trip').RouteStopDTO[] = [];
  routeStopsLoading: boolean = false;

  openTripModal(bus: BusDTO): void {
    this.tripSubmitError = '';
    this.tripSubmitSuccess = '';
    this.selectedBusForTrip = bus;
    this.isEditingTrip = false;
    this.originalTripKeys = null;
    this.routeStops = [];
    this.tripForm = {
      busRegistrationNumber: bus.registrationNumber,
      source: this.routes.length > 0 ? this.routes[0].source : '',
      destination: this.routes.length > 0 ? this.routes[0].destination : '',
      travelDate: '',
      arrivalDate: '',
      departureTime: '',
      arrivalTime: '',
      baseFare: 0,
      segments: []
    };
    
    if (this.routes.length > 0) {
      this.selectedRouteId = this.routes[0].routeId;
      this.fetchRouteStops(this.routes[0].source, this.routes[0].destination);
    } else {
      this.selectedRouteId = '';
    }
    
    this.showTripModal = true;
  }

  openEditTripModal(trip: TripDTO): void {
    // Construct a minimal bus object since full buses array might not be loaded
    const bus: Partial<BusDTO> = {
      registrationNumber: trip.busRegistrationNumber,
      busType: trip.busType,
      operatorCompanyName: trip.operatorName
    };
    
    
    this.tripSubmitError = '';
    this.tripSubmitSuccess = '';
    this.selectedBusForTrip = bus as BusDTO;
    this.isEditingTrip = true;
    this.originalTripKeys = {
      busRegistrationNumber: trip.busRegistrationNumber,
      source: trip.source,
      destination: trip.destination,
      travelDate: trip.travelDate
    };
    this.routeStops = [];
    
    // Copy trip to form
    this.tripForm = {
      busRegistrationNumber: trip.busRegistrationNumber,
      source: trip.source,
      destination: trip.destination,
      travelDate: trip.travelDate,
      arrivalDate: trip.arrivalDate,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      baseFare: trip.baseFare,
      segments: trip.segments ? trip.segments.map(seg => {
        let depDayOffset = 0;
        let arrDayOffset = 0;
        if (trip.travelDate) {
          const tripDate = new Date(trip.travelDate + 'T00:00:00Z');
          if (seg.departureDate) {
            const depDate = new Date(seg.departureDate + 'T00:00:00Z');
            depDayOffset = Math.round((depDate.getTime() - tripDate.getTime()) / (1000 * 60 * 60 * 24));
          }
          if (seg.arrivalDate) {
            const arrDate = new Date(seg.arrivalDate + 'T00:00:00Z');
            arrDayOffset = Math.round((arrDate.getTime() - tripDate.getTime()) / (1000 * 60 * 60 * 24));
          }
        }
        return {
          boardingStopId: seg.boardingStopId,
          droppingStopId: seg.droppingStopId,
          departureTime: seg.departureTime ? seg.departureTime.substring(0, 5) : '',
          arrivalTime: seg.arrivalTime ? seg.arrivalTime.substring(0, 5) : '',
          departureDayOffset: depDayOffset,
          arrivalDayOffset: arrDayOffset,
          fare: seg.fare
        };
      }) : []
    };

    const matchedRoute = this.routes.find(r => r.source === trip.source && r.destination === trip.destination);
    if (matchedRoute) {
      this.selectedRouteId = matchedRoute.routeId;
    } else {
      this.selectedRouteId = '';
    }

    this.fetchRouteStops(trip.source, trip.destination);
    this.showTripModal = true;
  }

  closeTripModal(): void {
    this.showTripModal = false;
    this.selectedBusForTrip = null;
    this.routeStops = [];
  }

  onRouteChange(route: RouteDTO): void {
    if (!route) return;
    this.selectedRouteId = route.routeId;
    this.tripForm.source = route.source;
    this.tripForm.destination = route.destination;
    this.fetchRouteStops(route.source, route.destination);
  }

  onRouteIdChange(): void {
    const route = this.routes.find(r => r.routeId === this.selectedRouteId);
    if (route) {
      this.onRouteChange(route);
    }
  }

  fetchRouteStops(source: string, destination: string): void {
    this.routeStopsLoading = true;
    
    // Fetch stops
    this.routeService.getRouteStops(source, destination).subscribe({
      next: (stops) => {
        this.routeStops = stops.sort((a, b) => a.stopSequence - b.stopSequence);
        this.routeStopsLoading = false;
        
        if (this.tripForm.segments!.length === 0) {
          this.addSegment();
        }
        
        this.cdr.detectChanges();
      },
      error: () => {
        this.routeStopsLoading = false;
        this.routeStops = [];
        this.cdr.detectChanges();
      }
    });

    // Fetch fares
    this.routeService.getRouteFares(source, destination).subscribe({
      next: (fares) => {
        this.routeFares = fares || [];
      },
      error: (err) => {
        console.error('Failed to load route fares', err);
        this.routeFares = [];
      }
    });
  }

  onSegmentStopChange(segment: import('../../../core/models/trip').TripSegmentCreateRequest): void {
    let copiedDep = false;
    let copiedArr = false;

    // 1. Auto-fill timings based on other segments with the same stops
    if (this.tripForm.segments && this.tripForm.segments.length > 1) {
      if (segment.boardingStopId) {
        const otherBoarding = this.tripForm.segments.find(s => s !== segment && s.boardingStopId === segment.boardingStopId && s.departureTime);
        if (otherBoarding) {
          segment.departureTime = otherBoarding.departureTime;
          segment.departureDayOffset = otherBoarding.departureDayOffset;
        } else {
          const otherDropping = this.tripForm.segments.find(s => s !== segment && s.droppingStopId === segment.boardingStopId && s.arrivalTime);
          if (otherDropping) {
            segment.departureTime = otherDropping.arrivalTime;
            segment.departureDayOffset = otherDropping.arrivalDayOffset;
          }
        }
      }
      
      if (segment.droppingStopId) {
        const otherDropping = this.tripForm.segments.find(s => s !== segment && s.droppingStopId === segment.droppingStopId && s.arrivalTime);
        if (otherDropping) {
          segment.arrivalTime = otherDropping.arrivalTime;
          segment.arrivalDayOffset = otherDropping.arrivalDayOffset;
        } else {
          const otherBoarding = this.tripForm.segments.find(s => s !== segment && s.boardingStopId === segment.droppingStopId && s.departureTime);
          if (otherBoarding) {
            segment.arrivalTime = otherBoarding.departureTime;
            segment.arrivalDayOffset = otherBoarding.departureDayOffset;
          }
        }
      }
    }

    // 2. Auto-fill fare based on RouteFares
    if (segment.boardingStopId && segment.droppingStopId) {
      const boardingStop = this.routeStops.find(s => s.routeStopId === segment.boardingStopId);
      const droppingStop = this.routeStops.find(s => s.routeStopId === segment.droppingStopId);

      if (boardingStop && droppingStop && boardingStop.fareLocationId && droppingStop.fareLocationId) {
        const matchingFare = this.routeFares.find(rf => 
          rf.fromFareLocationId === boardingStop.fareLocationId && 
          rf.toFareLocationId === droppingStop.fareLocationId
        );
        if (matchingFare) {
          segment.fare = matchingFare.fare;
        }
      }
    }
  }

  addSegment(): void {
    if (!this.tripForm.segments) {
      this.tripForm.segments = [];
    }
    this.tripForm.segments.push({
      boardingStopId: '',
      droppingStopId: '',
      departureTime: '',
      arrivalTime: '',
      departureDayOffset: 0,
      arrivalDayOffset: 0,
      fare: 0
    });
  }

  fareSortDesc: boolean = false;
  sortSegmentsByFare(): void {
    if (!this.tripForm.segments || this.tripForm.segments.length === 0) return;
    this.fareSortDesc = !this.fareSortDesc;
    this.tripForm.segments.sort((a, b) => {
      const fareA = a.fare || 0;
      const fareB = b.fare || 0;
      return this.fareSortDesc ? fareB - fareA : fareA - fareB;
    });
  }

  onTimeChange(segment: import('../../../core/models/trip').TripSegmentCreateRequest): void {
    if (segment.departureTime && segment.arrivalTime) {
      if (segment.arrivalTime < segment.departureTime) {
        if ((segment.arrivalDayOffset || 0) <= (segment.departureDayOffset || 0)) {
          segment.arrivalDayOffset = (segment.departureDayOffset || 0) + 1;
        }
      }
    }

    // Push times to other segments sharing the same stops
    if (this.tripForm.segments && this.tripForm.segments.length > 1) {
      for (const other of this.tripForm.segments) {
        if (other === segment) continue;

        if (segment.boardingStopId && segment.departureTime) {
          if (other.boardingStopId === segment.boardingStopId) {
            other.departureTime = segment.departureTime;
            other.departureDayOffset = segment.departureDayOffset;
          }
          if (other.droppingStopId === segment.boardingStopId) {
            other.arrivalTime = segment.departureTime;
            other.arrivalDayOffset = segment.departureDayOffset;
          }
        }

        if (segment.droppingStopId && segment.arrivalTime) {
          if (other.droppingStopId === segment.droppingStopId) {
            other.arrivalTime = segment.arrivalTime;
            other.arrivalDayOffset = segment.arrivalDayOffset;
          }
          if (other.boardingStopId === segment.droppingStopId) {
            other.departureTime = segment.arrivalTime;
            other.departureDayOffset = segment.arrivalDayOffset;
          }
        }
      }
    }

    // Zone day sync
    if (this.tripForm.segments && this.tripForm.segments.length > 1) {
      if (segment.boardingStopId && segment.departureDayOffset !== undefined && segment.departureDayOffset !== null) {
        const bStop = this.routeStops.find(s => s.routeStopId === segment.boardingStopId);
        if (bStop && bStop.fareLocationId) {
          for (const other of this.tripForm.segments) {
            if (other === segment) continue;
            if (other.boardingStopId) {
              const obStop = this.routeStops.find(s => s.routeStopId === other.boardingStopId);
              if (obStop && obStop.fareLocationId === bStop.fareLocationId) {
                other.departureDayOffset = segment.departureDayOffset;
              }
            }
            if (other.droppingStopId) {
              const odStop = this.routeStops.find(s => s.routeStopId === other.droppingStopId);
              if (odStop && odStop.fareLocationId === bStop.fareLocationId) {
                other.arrivalDayOffset = segment.departureDayOffset;
              }
            }
          }
        }
      }

      if (segment.droppingStopId && segment.arrivalDayOffset !== undefined && segment.arrivalDayOffset !== null) {
        const dStop = this.routeStops.find(s => s.routeStopId === segment.droppingStopId);
        if (dStop && dStop.fareLocationId) {
          for (const other of this.tripForm.segments) {
            if (other === segment) continue;
            if (other.boardingStopId) {
              const obStop = this.routeStops.find(s => s.routeStopId === other.boardingStopId);
              if (obStop && obStop.fareLocationId === dStop.fareLocationId) {
                other.departureDayOffset = segment.arrivalDayOffset;
              }
            }
            if (other.droppingStopId) {
              const odStop = this.routeStops.find(s => s.routeStopId === other.droppingStopId);
              if (odStop && odStop.fareLocationId === dStop.fareLocationId) {
                other.arrivalDayOffset = segment.arrivalDayOffset;
              }
            }
          }
        }
      }
    }
  }

  getFirstSegment(): import('../../../core/models/trip').TripSegmentCreateRequest | null {
    if (!this.tripForm.segments || this.tripForm.segments.length === 0) return null;
    let minDistance = Number.MAX_VALUE;
    let firstSeg = this.tripForm.segments[0];
    for (const seg of this.tripForm.segments) {
      if (seg.boardingStopId) {
        const stop = this.routeStops.find(s => s.routeStopId === seg.boardingStopId);
        if (stop && stop.distanceFromSourceKm < minDistance) {
          minDistance = stop.distanceFromSourceKm;
          firstSeg = seg;
        }
      }
    }
    return firstSeg;
  }

  getLastSegment(): import('../../../core/models/trip').TripSegmentCreateRequest | null {
    if (!this.tripForm.segments || this.tripForm.segments.length === 0) return null;
    let maxDistance = -1;
    let lastSeg = this.tripForm.segments[this.tripForm.segments.length - 1];
    for (const seg of this.tripForm.segments) {
      if (seg.droppingStopId) {
        const stop = this.routeStops.find(s => s.routeStopId === seg.droppingStopId);
        if (stop && stop.distanceFromSourceKm > maxDistance) {
          maxDistance = stop.distanceFromSourceKm;
          lastSeg = seg;
        }
      }
    }
    return lastSeg;
  }

  get derivedTripStartTime(): string {
    const firstSeg = this.getFirstSegment();
    if (firstSeg && firstSeg.departureTime) {
      return `${this.formatTimeAMPM(firstSeg.departureTime)} — Day ${(firstSeg.departureDayOffset || 0) + 1}`;
    }
    return '--:-- — Day 1';
  }

  get derivedTripEndTime(): string {
    const lastSeg = this.getLastSegment();
    if (lastSeg && lastSeg.arrivalTime) {
      return `${this.formatTimeAMPM(lastSeg.arrivalTime)} — Day ${(lastSeg.arrivalDayOffset || 0) + 1}`;
    }
    return '--:-- — Day 1';
  }

  formatTimeAMPM(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  }

  removeSegment(index: number): void {
    if (this.tripForm.segments) {
      this.tripForm.segments.splice(index, 1);
    }
  }

  getStopType(stopId: string): string {
    const stop = this.routeStops.find(s => s.routeStopId === stopId);
    return stop ? stop.stopType : '-';
  }

  getBoardingStops() {
    return this.routeStops.filter(s => s.canBoard || s.stopType === 'BOARDING' || s.stopType === 'INTERMEDIATE');
  }

  getDroppingStops() {
    return this.routeStops.filter(s => s.canDrop || s.stopType === 'DROPPING' || s.stopType === 'INTERMEDIATE');
  }

  get segmentValidationError(): string {
    if (!this.tripForm.segments || this.tripForm.segments.length === 0) return 'At least one segment is required.';
    
    const pairs = new Set<string>();
    const boardingPointToTime = new Map<string, string>(); // stopId -> depTimeKey
    const timeToBoardingPoint = new Map<string, string>(); // depTimeKey -> stopId
    
    const droppingPointToTime = new Map<string, string>(); // stopId -> arrTimeKey
    const timeToDroppingPoint = new Map<string, string>(); // arrTimeKey -> stopId
    
    let hasMissingFields = false;
    let hasSameStops = false;

    for (const seg of this.tripForm.segments) {
      if (!seg.boardingStopId || !seg.droppingStopId || !seg.departureTime || !seg.arrivalTime || seg.fare === null || seg.fare === undefined) {
        hasMissingFields = true;
      }
      if (seg.boardingStopId && seg.droppingStopId && seg.boardingStopId === seg.droppingStopId) {
        hasSameStops = true;
      }
      
      const pairKey = `${seg.boardingStopId}-${seg.droppingStopId}`;
      if (seg.boardingStopId && seg.droppingStopId) {
        if (pairs.has(pairKey)) {
          return 'This boarding point and dropping point combination already exists.';
        }
        pairs.add(pairKey);
      }

      if (seg.boardingStopId && seg.departureTime) {
        const depTimeKey = `${seg.departureDayOffset}-${seg.departureTime}`;
        // Rule 1: Same boarding point -> same time
        if (boardingPointToTime.has(seg.boardingStopId)) {
          if (boardingPointToTime.get(seg.boardingStopId) !== depTimeKey) {
            return 'The same boarding point cannot have different departure times or days.';
          }
        } else {
          boardingPointToTime.set(seg.boardingStopId, depTimeKey);
        }

        // Rule 3: Different boarding points -> different time
        if (timeToBoardingPoint.has(depTimeKey)) {
          if (timeToBoardingPoint.get(depTimeKey) !== seg.boardingStopId) {
            return 'Different boarding points cannot have the same departure time and day.';
          }
        } else {
          timeToBoardingPoint.set(depTimeKey, seg.boardingStopId);
        }
      }

      if (seg.droppingStopId && seg.arrivalTime) {
        const arrTimeKey = `${seg.arrivalDayOffset}-${seg.arrivalTime}`;
        // Rule 2: Same dropping point -> same time
        if (droppingPointToTime.has(seg.droppingStopId)) {
          if (droppingPointToTime.get(seg.droppingStopId) !== arrTimeKey) {
            return 'The same dropping point cannot have different arrival times or days.';
          }
        } else {
          droppingPointToTime.set(seg.droppingStopId, arrTimeKey);
        }

        // Rule 4: Different dropping points -> different time
        if (timeToDroppingPoint.has(arrTimeKey)) {
          if (timeToDroppingPoint.get(arrTimeKey) !== seg.droppingStopId) {
            return 'Different dropping points cannot have the same arrival time and day.';
          }
        } else {
          timeToDroppingPoint.set(arrTimeKey, seg.droppingStopId);
        }
      }
    }

    if (hasSameStops) {
      return 'Boarding and dropping stops must be different.';
    }

    if (hasMissingFields) {
      return 'Please fill all segment fields correctly.';
    }

    // Check monotonicity of days
    const stopDays = new Map<string, number>();
    for (const seg of this.tripForm.segments) {
      if (seg.boardingStopId && seg.departureDayOffset !== undefined && seg.departureDayOffset !== null) {
        if (!stopDays.has(seg.boardingStopId) || stopDays.get(seg.boardingStopId)! < seg.departureDayOffset) {
           stopDays.set(seg.boardingStopId, seg.departureDayOffset);
        }
      }
      if (seg.droppingStopId && seg.arrivalDayOffset !== undefined && seg.arrivalDayOffset !== null) {
        if (!stopDays.has(seg.droppingStopId) || stopDays.get(seg.droppingStopId)! < seg.arrivalDayOffset) {
           stopDays.set(seg.droppingStopId, seg.arrivalDayOffset);
        }
      }
    }

    let lastDay = -1;
    const orderedStops = [...this.routeStops].sort((a, b) => a.distanceFromSourceKm - b.distanceFromSourceKm);
    
    for (const stop of orderedStops) {
      if (stopDays.has(stop.routeStopId)) {
        const day = stopDays.get(stop.routeStopId)!;
        if (day < lastDay) {
          return `Day cannot decrease along the route. Stops further along the route must have a day >= Day ${lastDay + 1}.`;
        }
        lastDay = day;
      }
    }

    return '';
  }

  get isSegmentsValid(): boolean {
    return this.segmentValidationError === '';
  }

  saveTrip(): void {
    this.tripSubmitError = '';
    this.tripSubmitSuccess = '';

    const payload = { ...this.tripForm };
    
    // Auto-calculate rollover dates for segments based on departure vs travel date
    if (payload.travelDate && payload.segments && payload.segments.length > 0) {
      for (const seg of payload.segments) {
        // Departure Date Logic
        let depDate = new Date(payload.travelDate);
        depDate.setDate(depDate.getDate() + (seg.departureDayOffset || 0));
        let arrDate = new Date(payload.travelDate);
        arrDate.setDate(arrDate.getDate() + (seg.arrivalDayOffset || 0));
        
        let yyyy = depDate.getFullYear();
        let mm = String(depDate.getMonth() + 1).padStart(2, '0');
        let dd = String(depDate.getDate()).padStart(2, '0');
        seg.departureDate = `${yyyy}-${mm}-${dd}`;
        
        yyyy = arrDate.getFullYear();
        mm = String(arrDate.getMonth() + 1).padStart(2, '0');
        dd = String(arrDate.getDate()).padStart(2, '0');
        seg.arrivalDate = `${yyyy}-${mm}-${dd}`;

        // Ensure seconds
        if (seg.departureTime.length === 5) seg.departureTime += ':00';
        if (seg.arrivalTime.length === 5) seg.arrivalTime += ':00';

        const exactDepDate = new Date(`${seg.departureDate}T${seg.departureTime}`);
        if (exactDepDate < new Date()) {
          this.tripSubmitError = 'Departure time cannot be in the past.';
          return;
        }
        
        const exactArrDate = new Date(`${seg.arrivalDate}T${seg.arrivalTime}`);
        if (exactArrDate <= exactDepDate) {
          this.tripSubmitError = 'Arrival time must be strictly after departure time.';
          return;
        }
      }
      
      // Set overall trip times from segments using route distance
      const firstSeg = this.getFirstSegment();
      const lastSeg = this.getLastSegment();
      if (firstSeg && lastSeg) {
        payload.departureTime = firstSeg.departureTime;
        payload.arrivalTime = lastSeg.arrivalTime;
        payload.arrivalDate = lastSeg.arrivalDate || '';
      }
    }

    if (this.isEditingTrip) {
      this.tripSubmitLoading = true;
      this.tripService.updateTrip(
        this.originalTripKeys.busRegistrationNumber,
        this.originalTripKeys.source,
        this.originalTripKeys.destination,
        this.originalTripKeys.travelDate,
        payload
      ).subscribe({
        next: () => {
          this.tripSubmitSuccess = 'Trip updated successfully!';
          this.tripSubmitLoading = false;
          this.fetchBuses(); // Refresh fleet list
          this.searchTrips(); // Refresh search if in Trips tab
          setTimeout(() => this.closeTripModal(), 2000);
        },
        error: (err) => {
          this.tripSubmitLoading = false;
          this.tripSubmitError = err.error?.message || 'Failed to update trip. Please check your inputs.';
        }
      });
    } else {
      this.tripSubmitLoading = true;
      this.tripService.createTrip(payload).subscribe({
        next: () => {
          this.tripSubmitSuccess = 'Trip scheduled successfully!';
          this.tripSubmitLoading = false;
          this.fetchBuses(); // Refresh fleet list so "Edit Active Trip" appears
          setTimeout(() => this.closeTripModal(), 2000);
        },
        error: (err) => {
          this.tripSubmitLoading = false;
          this.tripSubmitError = err.error?.message || 'Failed to schedule trip. Please check your inputs.';
        }
      });
    }
  }

  // SEATS
  manageSeats(bus: BusDTO): void {
    this.selectedBusForSeats = bus;
    this.fetchSeats(bus.registrationNumber);
  }

  fetchSeats(reg: string): void {
    this.seatsLoading = true;
    this.busService.getSeatsByBus(reg).subscribe({
      next: (res) => {
        this.busSeats = res;
        this.seatsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.seatsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  backToBuses(): void {
    this.selectedBusForSeats = null;
  }

  openSeatModal(seat?: BusSeatDTO): void {
    this.seatSubmitError = '';
    this.seatSubmitSuccess = '';
    if (seat) {
      this.isEditingSeat = true;
      this.originalSeatNumber = seat.seatNumber;
      this.seatForm = {
        seatNumber: seat.seatNumber,
        seatPosition: seat.seatPosition || 'UPPER'
      };
    } else {
      this.isEditingSeat = false;
      this.seatForm = {
        seatNumber: '',
        seatPosition: 'UPPER'
      };
    }
    this.showSeatModal = true;
  }

  closeSeatModal(): void {
    this.showSeatModal = false;
  }

  saveSeat(): void {
    this.seatSubmitError = '';
    this.seatSubmitSuccess = '';
    if (!this.selectedBusForSeats) return;

    if (this.isEditingSeat) {
      this.busService.updateBusSeat(this.selectedBusForSeats.registrationNumber, this.originalSeatNumber, this.seatForm).subscribe({
        next: () => {
          this.seatSubmitSuccess = 'Seat updated!';
          this.fetchSeats(this.selectedBusForSeats!.registrationNumber);
          setTimeout(() => this.closeSeatModal(), 1000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.seatSubmitError = err.error?.message || 'Error updating seat';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.busService.createBusSeat(this.selectedBusForSeats.registrationNumber, this.seatForm).subscribe({
        next: () => {
          this.seatSubmitSuccess = 'Seat created!';
          this.fetchSeats(this.selectedBusForSeats!.registrationNumber);
          setTimeout(() => this.closeSeatModal(), 1000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.seatSubmitError = err.error?.message || 'Error creating seat.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  autoConfigureSeats(): void {
    if (!this.selectedBusForSeats) return;
    
    this.isConfiguringSeats = true;
    this.seatSubmitError = '';
    this.seatSubmitSuccess = '';
    this.cdr.detectChanges();

    const busType = this.selectedBusForSeats.busType;
    const seatRequests: BusSeatCreateRequest[] = [];

    if (busType === 'SLEEPER') {
      // 18 Lower, 18 Upper
      for (let i = 1; i <= 18; i++) {
        seatRequests.push({ seatNumber: `L${i}`, seatPosition: 'LOWER' });
      }
      for (let i = 1; i <= 18; i++) {
        seatRequests.push({ seatNumber: `U${i}`, seatPosition: 'UPPER' });
      }
    } else if (busType === 'SEMI_SLEEPER') {
      // 24 Lower (Seater), 15 Upper (Sleeper)
      for (let i = 1; i <= 24; i++) {
        seatRequests.push({ seatNumber: `L${i}`, seatPosition: 'LOWER' });
      }
      for (let i = 1; i <= 15; i++) {
        seatRequests.push({ seatNumber: `U${i}`, seatPosition: 'UPPER' });
      }
    } else {
      // SEATER: 40 Lower
      for (let i = 1; i <= 40; i++) {
        seatRequests.push({ seatNumber: `L${i}`, seatPosition: 'LOWER' });
      }
    }

    import('rxjs').then(({ from, concatMap, toArray, finalize }) => {
      from(seatRequests).pipe(
        concatMap(req => this.busService.createBusSeat(this.selectedBusForSeats!.registrationNumber, req)),
        toArray(),
        finalize(() => {
          this.isConfiguringSeats = false;
          this.cdr.detectChanges();
        })
      ).subscribe({
        next: () => {
          this.fetchSeats(this.selectedBusForSeats!.registrationNumber);
        },
        error: (err) => {
          this.seatSubmitError = 'An error occurred during auto-configuration. Some seats may have already existed.';
        }
      });
    });
  }

  // ==========================================================
  // TRIP MANAGEMENTS
  // TICKETS
  validateTicket(): void {
    if (!this.ticketNumberToValidate) return;
    this.ticketValidationMsg = '';
    this.ticketValidationError = '';
    this.http.patch<ApiResponse<any>>(`/api/tickets/${this.ticketNumberToValidate}/validate`, {}).subscribe({
      next: (res) => {
        this.ticketValidationMsg = 'Ticket validated successfully! Passenger can board.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.ticketValidationError = err.error?.message || 'Failed to validate ticket. It may be invalid, cancelled, or already boarded.';
        this.cdr.detectChanges();
      }
    });
  }

  // TRIPS
  searchTrips(): void {
    this.tripSearchLoading = true;
    this.tripService.searchTrips(this.tripSearchForm).subscribe({
      next: (res) => {
        this.tripSearchResults = res.data;
        this.tripSearchLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.tripSearchLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelTrip(trip: TripDTO): void {
    const reason = prompt('Cancellation reason:');
    if (reason) {
      this.tripService.cancelTrip(trip.busRegistrationNumber, trip.source, trip.destination, trip.travelDate, reason).subscribe({
        next: () => {
          this.searchTrips();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error');
          this.cdr.detectChanges();
        }
      });
    }
  }

  // PASSENGERS MODAL
  showPassengersModal: boolean = false;
  tripPassengers: any[] = [];
  tripPassengersLoading: boolean = false;
  selectedTripForPassengers: TripDTO | null = null;

  openPassengersModal(trip: TripDTO): void {
    this.selectedTripForPassengers = trip;
    this.showPassengersModal = true;
    this.tripPassengersLoading = true;
    this.tripPassengers = [];
    
    this.http.get<ApiResponse<any[]>>(`/api/trips/${trip.tripId}/passengers`).subscribe({
      next: (res) => {
        this.tripPassengers = res.data;
        this.tripPassengersLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load passengers', err);
        this.tripPassengersLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closePassengersModal(): void {
    this.showPassengersModal = false;
    this.selectedTripForPassengers = null;
    this.tripPassengers = [];
  }

  toggleAiInsights(trip: TripDTO): void {
    if (this.aiInsights.has(trip.tripId)) {
      this.aiInsights.delete(trip.tripId);
      return;
    }

    const state: any = { loading: true, demand: null, pricing: null, delay: null, error: '' };
    this.aiInsights.set(trip.tripId, state);

    // Fetch Demand Prediction
    this.aiService.getDemandPrediction(trip.tripId).subscribe({
      next: (demandRes) => {
        if (demandRes.success) {
          state.demand = demandRes.data;
          // Fetch Pricing Simulation
          this.aiService.getDynamicPricing(trip.tripId).subscribe({
            next: (pricingRes) => {
              if (pricingRes.success) {
                state.pricing = pricingRes.data;
              }
              // Fetch Delay Prediction (optional phase 9)
              this.aiService.getDelayPrediction(trip.tripId).subscribe({
                next: (delayRes) => {
                  if (delayRes.success) {
                    state.delay = delayRes.data;
                  }
                  state.loading = false;
                  this.cdr.detectChanges();
                },
                error: () => {
                  // Delay prediction might fail if external APIs fail or not enough data, ignore and show what we have
                  state.loading = false;
                  this.cdr.detectChanges();
                }
              });
            },
            error: () => {
              state.loading = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          state.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        state.loading = false;
        state.error = 'Failed to load AI Insights.';
        this.cdr.detectChanges();
      }
    });
  }

  // SUPPORT AGENTS
  createSupportAgent(): void {
    this.supportAgentSubmitError = '';
    this.supportAgentSubmitSuccess = '';
    this.supportAgentLoading = true;

    this.http.post<ApiResponse<any>>('/api/operators/support-agents', this.supportAgentForm).subscribe({
      next: () => {
        this.supportAgentSubmitSuccess = 'Support Agent created successfully!';
        this.supportAgentForm = {
          fullName: '',
          email: '',
          mobileNumber: '',
          password: ''
        };
        this.supportAgentLoading = false;
        this.fetchSupportAgents();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.supportAgentSubmitError = err.error?.message || 'Failed to create Support Agent.';
        this.supportAgentLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
