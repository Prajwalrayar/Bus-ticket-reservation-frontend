import { Component, OnInit, signal } from '@angular/core';
import { TripDTO, TripSearchRequest, RouteStopDTO } from '../../core/models/trip';
import { ActivatedRoute, Router } from '@angular/router';
import { TripService } from '../../core/services/trip.service';
import { AiService } from '../../core/services/ai.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-bus-search',
  standalone: false,
  templateUrl: './bus-search.component.html',
  styleUrl: './bus-search.component.css',
})
export class BusSearchComponent implements OnInit {

  buses: TripDTO[] = [];
  filteredBuses: TripDTO[] = [];

  fromCity = '';
  toCity = '';
  journeyDate = '';

  loading = signal(false);
  errorMessage = signal('');

  // Filters state
  selectedBusTypes = new Set<string>();
  isAcSelected = false;
  isNonAcSelected = false;

  // Sorting state
  sortOption = 'default';

  // AI State
  smartRecommendations: any[] = [];
  travelOptions: any[] = [];
  isAiLoading = false;

  // Details State (maps tripId to its details)
  expandedTrips = new Map<string, { loading: boolean; boarding: RouteStopDTO[]; dropping: RouteStopDTO[]; error: string }>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripService: TripService,
    private aiService: AiService,
    private authStateService: AuthStateService
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras.state as { aiResults: TripDTO[] };
    if (state && state.aiResults) {
      this.buses = state.aiResults;
      this.filteredBuses = [...this.buses];
    }
  }

  ngOnInit(): void {
    if (this.buses.length > 0) {
      // AI Search results already populated
      return;
    }
    this.route.queryParams.subscribe(params => {
      this.fromCity = params['from'] || '';
      this.toCity = params['to'] || '';
      this.journeyDate = params['date'] || '';

      this.searchBuses();
    });
  }

  private searchBuses(): void {
    if (!this.fromCity || !this.toCity) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const request: TripSearchRequest = {
      source: this.fromCity,
      destination: this.toCity,
      travelDate: this.journeyDate || undefined
    };

    this.tripService.searchTrips(request).subscribe({
      next: (response) => {
        console.log('Buses received:', response.data);
        this.buses = response.data || [];
        this.applyFiltersAndSort();
        this.loading.set(false);
        this.fetchAiData();
      },
      error: (error) => {
        console.error('Error searching buses:', error);
        this.loading.set(false);
        this.errorMessage.set('Unable to load buses. Please try again.');
        this.fetchAiData();
      }
    });
  }

  private fetchAiData() {
    this.isAiLoading = true;

    // Smart Route Recommendations (Phase 3)
    this.aiService.getTravelRecommendations(this.fromCity, this.toCity, this.journeyDate).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.travelOptions = res.data;
        }
      }
    });

    // Personal Recommendations (Phase 2)
    if (this.authStateService.isLoggedIn()) {
      const user = this.authStateService.getUser();
      if (user && user.userId) {
        this.aiService.getSmartRecommendations(user.userId).subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.smartRecommendations = res.data;
            }
          }
        });
      }
    }
  }

  // --- Filtering & Sorting Logic ---

  toggleBusType(type: string): void {
    if (this.selectedBusTypes.has(type)) {
      this.selectedBusTypes.delete(type);
    } else {
      this.selectedBusTypes.add(type);
    }
    this.applyFiltersAndSort();
  }

  toggleAc(): void {
    this.isAcSelected = !this.isAcSelected;
    this.applyFiltersAndSort();
  }

  toggleNonAc(): void {
    this.isNonAcSelected = !this.isNonAcSelected;
    this.applyFiltersAndSort();
  }

  onSortChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.sortOption = selectElement.value;
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    let result = [...this.buses];

    // Filter by Seater/Sleeper
    if (this.selectedBusTypes.size > 0) {
      result = result.filter(bus => {
        return Array.from(this.selectedBusTypes).some(selected =>
          bus.busType?.toUpperCase().includes(selected.toUpperCase())
        );
      });
    }

    // Filter by AC / Non-AC
    if (this.isAcSelected && !this.isNonAcSelected) {
      result = result.filter(bus => bus.busType?.toUpperCase().includes('AC') && !bus.busType?.toUpperCase().includes('NON_AC'));
    } else if (this.isNonAcSelected && !this.isAcSelected) {
      result = result.filter(bus => bus.busType?.toUpperCase().includes('NON_AC'));
    }

    // Sort
    switch (this.sortOption) {
      case 'priceAsc':
        result.sort((a, b) => a.baseFare - b.baseFare);
        break;
      case 'priceDesc':
        result.sort((a, b) => b.baseFare - a.baseFare);
        break;
      case 'departureEarly':
        result.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
        break;
      case 'departureLate':
        result.sort((a, b) => b.departureTime.localeCompare(a.departureTime));
        break;
      default:
        break;
    }

    this.filteredBuses = result;
  }

  // --- Trip Details ---

  toggleDetails(trip: TripDTO): void {
    if (this.expandedTrips.has(trip.tripId)) {
      // Toggle off
      this.expandedTrips.delete(trip.tripId);
      return;
    }

    // Toggle on and load
    this.expandedTrips.set(trip.tripId, { loading: true, boarding: [], dropping: [], error: '' });

    if (trip.stopFares && trip.stopFares.length > 0) {
      // Use pre-loaded stop fares to construct stops
      const stops = trip.stopFares.map(tsf => ({
        routeStopId: tsf.routeStopId,
        stopName: tsf.stopName,
        stopSequence: tsf.stopSequence,
        stopType: tsf.stopType as import('../../core/models/trip').StopType,
        distanceFromSourceKm: 0, // not critical for UI
        source: trip.source,
        destination: trip.destination
      }));
      const boarding = stops.filter(s => s.stopType === 'BOARDING' || s.stopType === 'INTERMEDIATE').sort((a, b) => a.stopSequence - b.stopSequence);
      const dropping = stops.filter(s => s.stopType === 'DROPPING' || s.stopType === 'INTERMEDIATE').sort((a, b) => a.stopSequence - b.stopSequence);
      this.expandedTrips.set(trip.tripId, { loading: false, boarding, dropping, error: '' });
      return;
    }

    this.tripService.getRouteStops(trip.source, trip.destination).subscribe({
      next: (response) => {
        const stops = response.data || [];
        // Boarding can be 'BOARDING' or 'INTERMEDIATE'
        const boarding = stops.filter(s => s.stopType === 'BOARDING' || s.stopType === 'INTERMEDIATE').sort((a, b) => a.stopSequence - b.stopSequence);
        // Dropping can be 'DROPPING' or 'INTERMEDIATE'
        const dropping = stops.filter(s => s.stopType === 'DROPPING' || s.stopType === 'INTERMEDIATE').sort((a, b) => a.stopSequence - b.stopSequence);

        this.expandedTrips.set(trip.tripId, { loading: false, boarding, dropping, error: '' });
      },
      error: (error) => {
        console.error('Error fetching route stops:', error);
        this.expandedTrips.set(trip.tripId, { loading: false, boarding: [], dropping: [], error: 'Failed to load route stops.' });
      }
    });
  }

  getDuration(departureTime: string, arrivalTime: string): string {
    if (!departureTime || !arrivalTime) return '';

    const [depH, depM] = departureTime.split(':').map(Number);
    const [arrH, arrM] = arrivalTime.split(':').map(Number);

    let depDate = new Date();
    depDate.setHours(depH, depM, 0, 0);

    let arrDate = new Date();
    arrDate.setHours(arrH, arrM, 0, 0);

    // If arrival is earlier than departure, assume next day
    if (arrDate < depDate) {
      arrDate.setDate(arrDate.getDate() + 1);
    }

    const diffMs = arrDate.getTime() - depDate.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHrs}h ${diffMins}m`;
  }

  // --- UI Interactions ---

  modifySearch(): void {
    this.router.navigate(['/'], {
      queryParams: {
        from: this.fromCity,
        to: this.toCity,
        date: this.journeyDate
      }
    });
  }

  viewSeats(bus: TripDTO): void {
    this.router.navigate(
      ['/seat-selection'],
      {
        queryParams: {
          tripId: bus.tripId,
          from: this.fromCity,
          to: this.toCity,
          date: this.journeyDate
        }
      }
    );
  }
}
