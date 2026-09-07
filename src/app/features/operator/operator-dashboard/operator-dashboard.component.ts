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

  // Utility — today's date in YYYY-MM-DD for date input [min]
  today: string = new Date().toISOString().split('T')[0];


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
    amenities: []
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

  constructor(
    private operatorService: OperatorService,
    private busService: BusService,
    private tripService: TripService,
    private routeService: RouteService,
    private http: HttpClient,
    private aiService: AiService,
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef
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
        this.cdr.detectChanges();
      });
      this.routeService.getAllRoutes().subscribe(res => {
        this.dashboardRoutesCount = res.filter(r => r.isActive).length;
        this.cdr.detectChanges();
      });
    }
  }

  // PROFILE
  saveProfile(): void {
    if (!this.operatorProfile) return;
    this.operatorService.updateOperator(this.companyNameInput, this.operatorProfile).subscribe({
      next: (res) => {
        this.operatorProfile = res;
        alert('Profile updated successfully!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Failed to update profile.');
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

  openBusModal(bus?: BusDTO): void {
    this.busSubmitError = '';
    this.busSubmitSuccess = '';
    if (bus) {
      this.isEditingBus = true;
      this.busForm = {
        registrationNumber: bus.registrationNumber,
        busType: bus.busType,
        operatorCompanyName: bus.operatorCompanyName,
        amenities: bus.amenities || []
      };
    } else {
      this.isEditingBus = false;
      this.busForm = {
        registrationNumber: '',
        busType: 'SEATER',
        operatorCompanyName: this.companyNameInput,
        amenities: []
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
      stopFares: {}
    };
    
    if (this.routes.length > 0) {
      this.fetchRouteStops(this.routes[0].source, this.routes[0].destination);
    }
    
    this.showTripModal = true;
  }

  closeTripModal(): void {
    this.showTripModal = false;
    this.selectedBusForTrip = null;
    this.routeStops = [];
  }

  onRouteChange(route: RouteDTO): void {
    this.tripForm.source = route.source;
    this.tripForm.destination = route.destination;
    this.fetchRouteStops(route.source, route.destination);
  }

  fetchRouteStops(source: string, destination: string): void {
    this.routeStopsLoading = true;
    this.routeService.getRouteStops(source, destination).subscribe({
      next: (stops) => {
        // Filter out the primary source from dropping points if necessary, 
        // usually we just want to set fares to intermediate/dropping points
        this.routeStops = stops.filter(s => s.stopName.toLowerCase() !== source.toLowerCase());
        this.routeStopsLoading = false;
        
        // Initialize stopFares
        this.tripForm.stopFares = {};
        this.routeStops.forEach(stop => {
          this.tripForm.stopFares![stop.routeStopId] = 0;
        });
        
        this.cdr.detectChanges();
      },
      error: () => {
        this.routeStopsLoading = false;
        this.routeStops = [];
        this.cdr.detectChanges();
      }
    });
  }

  onStopFareChange(routeStopId: string, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value) || 0;
    if (this.tripForm.stopFares) {
      this.tripForm.stopFares[routeStopId] = val;
    }
  }

  saveTrip(): void {
    this.tripSubmitError = '';
    this.tripSubmitSuccess = '';
    this.tripService.createTrip(this.tripForm).subscribe({
      next: () => {
        this.tripSubmitSuccess = 'Trip scheduled successfully!';
        setTimeout(() => this.closeTripModal(), 1600);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.tripSubmitError = err.error?.message || 'Failed to schedule trip.';
        this.cdr.detectChanges();
      }
    });
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
          alert(err.error?.message || 'Error');
          this.cdr.detectChanges();
        }
      });
    }
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
