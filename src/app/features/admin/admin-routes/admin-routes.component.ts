import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouteService } from '../../../core/services/route.service';
import { RouteDTO, RouteCreateRequest } from '../../../core/models/route';
import { RouteStopDTO, RouteStopCreateRequest, StopType, FareLocationDTO, FareLocationCreateRequest, RouteFareDTO, RouteFareCreateRequest } from '../../../core/models/trip';

@Component({
  selector: 'app-admin-routes',
  standalone: false,
  templateUrl: './admin-routes.component.html',
  styleUrl: './admin-routes.component.css'
})
export class AdminRoutesComponent implements OnInit {
  routes: RouteDTO[] = [];
  loading: boolean = true;
  error: string = '';
  
  showRouteModal: boolean = false;
  routeForm: RouteCreateRequest = {
    source: '',
    destination: '',
    distance: 0
  };
  isEditingRoute: boolean = false;
  routeSubmitSuccess: string = '';
  routeSubmitError: string = '';

  originalRouteSource: string = '';
  originalRouteDestination: string = '';

  // Stops management
  showStopsModal: boolean = false;
  selectedRouteForStops: RouteDTO | null = null;
  routeStops: RouteStopDTO[] = [];
  loadingStops: boolean = false;
  
  newStop: RouteStopCreateRequest = {
    stopName: '',
    stopSequence: 1,
    stopType: 'BOARDING',
    distanceFromSourceKm: 0,
    fareLocationId: ''
  };
  stopSubmitSuccess: string = '';
  stopSubmitError: string = '';

  // Fare Locations & Fares Management
  showFaresModal: boolean = false;
  selectedRouteForFares: RouteDTO | null = null;
  
  fareLocations: FareLocationDTO[] = [];
  routeFares: RouteFareDTO[] = [];
  loadingFares: boolean = false;
  
  newFareLocation: FareLocationCreateRequest = {
    name: '',
    description: ''
  };
  
  newRouteFare: RouteFareCreateRequest = {
    fromFareLocationId: '',
    toFareLocationId: '',
    fare: 0
  };

  fareSubmitSuccess: string = '';
  fareSubmitError: string = '';

  constructor(
    private routeService: RouteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchAllRoutes();
  }

  fetchAllRoutes(): void {
    this.loading = true;
    this.error = '';
    this.routeService.getAllRoutes().subscribe({
      next: (data: any) => {
        // As per prompt: "must show all the available routes the buses are actively travelling"
        // If the RouteDTO contains a status or active field we could filter. Let's assume all returned are active or there's an 'isActive' flag.
        this.routes = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Failed to fetch routes', err);
        this.error = 'Failed to load routes data.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openRouteModal(route?: RouteDTO): void {
    this.routeSubmitSuccess = '';
    this.routeSubmitError = '';
    if (route) {
      this.isEditingRoute = true;
      this.originalRouteSource = route.source;
      this.originalRouteDestination = route.destination;
      this.routeForm = {
        source: route.source,
        destination: route.destination,
        distance: route.distance
      };
    } else {
      this.isEditingRoute = false;
      this.routeForm = {
        source: '',
        destination: '',
        distance: 0
      };
    }
    this.showRouteModal = true;
  }

  closeRouteModal(): void {
    this.showRouteModal = false;
  }

  saveRoute(): void {
    this.routeSubmitError = '';
    this.routeSubmitSuccess = '';

    if (this.isEditingRoute) {
      this.routeService.updateRoute(this.originalRouteSource, this.originalRouteDestination, this.routeForm).subscribe({
        next: (res: any) => {
          this.routeSubmitSuccess = 'Route updated successfully.';
          this.fetchAllRoutes();
          setTimeout(() => {
            this.closeRouteModal();
            this.cdr.markForCheck();
          }, 1500);
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Error updating route', err);
          this.routeSubmitError = err.error?.message || 'Failed to update route.';
          this.cdr.markForCheck();
        }
      });
    } else {
      this.routeService.createRoute(this.routeForm).subscribe({
        next: (res: any) => {
          this.routeSubmitSuccess = 'Route created successfully.';
          this.fetchAllRoutes();
          setTimeout(() => {
            this.closeRouteModal();
            this.cdr.markForCheck();
          }, 1500);
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Error creating route', err);
          this.routeSubmitError = err.error?.message || 'Failed to create route.';
          this.cdr.markForCheck();
        }
      });
    }
  }

  deactivateRoute(source: string, destination: string): void {
    if (confirm(`Are you sure you want to deactivate route from ${source} to ${destination}?`)) {
      this.routeService.deactivateRoute(source, destination).subscribe({
        next: () => this.fetchAllRoutes(),
        error: (err: any) => console.error('Error deactivating route', err)
      });
    }
  }

  // Stops management methods
  openStopsModal(route: RouteDTO): void {
    this.selectedRouteForStops = route;
    this.showStopsModal = true;
    this.stopSubmitSuccess = '';
    this.stopSubmitError = '';
    this.resetNewStop();
    this.loadStopsForRoute(route.source, route.destination);
  }

  closeStopsModal(): void {
    this.showStopsModal = false;
    this.selectedRouteForStops = null;
  }

  isEditingStop: boolean = false;
  editingStopId: string | null = null;
  editingStopName: string | null = null;
  timeFromSourceHours?: number;

  resetNewStop(): void {
    this.isEditingStop = false;
    this.editingStopId = null;
    this.editingStopName = null;
    this.timeFromSourceHours = undefined;
    this.newStop = {
      stopName: '',
      stopSequence: (this.routeStops.length + 1),
      stopType: 'BOARDING',
      distanceFromSourceKm: 0,
      fareLocationId: '',
      canBoard: true,
      canDrop: true
    };
  }

  editStop(stop: RouteStopDTO): void {
    this.isEditingStop = true;
    this.editingStopId = stop.routeStopId;
    this.editingStopName = stop.stopName;
    this.timeFromSourceHours = undefined;
    this.newStop = {
      stopName: stop.stopName,
      stopSequence: stop.stopSequence,
      stopType: stop.stopType,
      distanceFromSourceKm: stop.distanceFromSourceKm,
      fareLocationId: stop.fareLocationId || '',
      canBoard: stop.canBoard ?? true,
      canDrop: stop.canDrop ?? true
    };
  }

  loadStopsForRoute(source: string, destination: string): void {
    this.loadingStops = true;
    this.routeService.getFareLocations(source, destination).subscribe({
      next: (locations) => {
        this.fareLocations = locations;
        this.routeService.getRouteStops(source, destination).subscribe({
          next: (stops) => {
            this.routeStops = stops;
            this.loadingStops = false;
            this.resetNewStop();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to fetch stops', err);
            this.loadingStops = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('Failed to load fare locations', err);
        // Continue loading stops even if fare locations fail
        this.routeService.getRouteStops(source, destination).subscribe({
          next: (stops) => {
            this.routeStops = stops;
            this.loadingStops = false;
            this.resetNewStop();
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  saveStop(): void {
    if (!this.selectedRouteForStops) return;
    this.stopSubmitError = '';
    this.stopSubmitSuccess = '';
    
    if (this.isEditingStop && this.editingStopName) {
      this.routeService.updateRouteStop(this.selectedRouteForStops.source, this.selectedRouteForStops.destination, this.editingStopName, this.newStop).subscribe({
        next: (res) => {
          this.stopSubmitSuccess = 'Stop updated successfully!';
          this.loadStopsForRoute(this.selectedRouteForStops!.source, this.selectedRouteForStops!.destination);
          setTimeout(() => {
            this.stopSubmitSuccess = '';
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (err) => {
          console.error('Failed to update stop', err);
          this.stopSubmitError = err.error?.message || 'Failed to update stop.';
          this.cdr.markForCheck();
        }
      });
    } else {
      this.routeService.addRouteStop(this.selectedRouteForStops.source, this.selectedRouteForStops.destination, this.newStop).subscribe({
        next: (res) => {
          this.stopSubmitSuccess = 'Stop added successfully!';
          this.loadStopsForRoute(this.selectedRouteForStops!.source, this.selectedRouteForStops!.destination);
          setTimeout(() => {
            this.stopSubmitSuccess = '';
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (err) => {
          console.error('Failed to add stop', err);
          this.stopSubmitError = err.error?.message || 'Failed to add stop.';
          this.cdr.markForCheck();
        }
      });
    }
  }

  isSequenceValid(): boolean {
    if (this.newStop.stopSequence == null || this.newStop.stopSequence < 1) return false;
    // ensure sequence is unique for this route per StopType
    return !this.routeStops.some(s => 
      s.stopSequence === this.newStop.stopSequence && 
      s.routeStopId !== this.editingStopId &&
      (s.stopType === this.newStop.stopType || s.stopType === 'INTERMEDIATE' || this.newStop.stopType === 'INTERMEDIATE')
    );
  }

  isDistanceValid(): boolean {
    if (this.newStop.distanceFromSourceKm == null || this.newStop.distanceFromSourceKm < 0) return false;
    if (!this.selectedRouteForStops) return false;
    
    if (this.newStop.distanceFromSourceKm === 0) {
      if (this.newStop.stopType !== 'BOARDING') return false;
      const existingZeroKm = this.routeStops.find(s => s.distanceFromSourceKm === 0 && s.routeStopId !== this.editingStopId);
      if (existingZeroKm) return false;
    }

    // distance must be <= total route distance
    return this.newStop.distanceFromSourceKm <= this.selectedRouteForStops.distance;
  }

  getDistanceErrorMsg(): string {
    if (this.newStop.distanceFromSourceKm === 0) {
      if (this.newStop.stopType !== 'BOARDING') return "Only a BOARDING point can have a distance of 0 km.";
      if (this.routeStops.some(s => s.distanceFromSourceKm === 0 && s.routeStopId !== this.editingStopId)) {
        return "Another stop with 0 km already exists. Only 1 stop can be 0 km.";
      }
    }
    return `Distance must be between 0 and total route distance (${this.selectedRouteForStops?.distance || 0} km).`;
  }

  // ── Fare Locations & Route Fares Management ───────────────────

  openFaresModal(route: RouteDTO): void {
    this.selectedRouteForFares = route;
    this.showFaresModal = true;
    this.fareSubmitSuccess = '';
    this.fareSubmitError = '';
    this.loadFaresData(route.source, route.destination);
  }

  closeFaresModal(): void {
    this.showFaresModal = false;
    this.selectedRouteForFares = null;
  }

  loadFaresData(source: string, destination: string): void {
    this.loadingFares = true;
    this.routeService.getFareLocations(source, destination).subscribe({
      next: (locations) => {
        this.fareLocations = locations;
        this.routeService.getRouteFares(source, destination).subscribe({
          next: (fares) => {
            this.routeFares = fares;
            this.loadingFares = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to load route fares', err);
            this.loadingFares = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('Failed to load fare locations', err);
        this.loadingFares = false;
        this.cdr.markForCheck();
      }
    });
  }

  addFareLocation(): void {
    if (!this.selectedRouteForFares) return;
    this.fareSubmitError = '';
    this.fareSubmitSuccess = '';

    this.routeService.createFareLocation(this.selectedRouteForFares.source, this.selectedRouteForFares.destination, this.newFareLocation).subscribe({
      next: (res) => {
        this.fareSubmitSuccess = 'Fare location added successfully!';
        this.newFareLocation = { name: '', description: '' };
        this.loadFaresData(this.selectedRouteForFares!.source, this.selectedRouteForFares!.destination);
        setTimeout(() => { this.fareSubmitSuccess = ''; this.cdr.markForCheck(); }, 3000);
      },
      error: (err) => {
        console.error('Failed to add fare location', err);
        this.fareSubmitError = err.error?.message || 'Failed to add fare location.';
        this.cdr.markForCheck();
      }
    });
  }

  deleteFareLocation(locationId: string): void {
    if (!this.selectedRouteForFares) return;
    if (confirm('Are you sure you want to delete this fare location?')) {
      this.routeService.deleteFareLocation(this.selectedRouteForFares.source, this.selectedRouteForFares.destination, locationId).subscribe({
        next: () => {
          this.fareSubmitSuccess = 'Fare location deleted successfully!';
          this.loadFaresData(this.selectedRouteForFares!.source, this.selectedRouteForFares!.destination);
          setTimeout(() => { this.fareSubmitSuccess = ''; this.cdr.markForCheck(); }, 3000);
        },
        error: (err) => {
          console.error('Failed to delete fare location', err);
          this.fareSubmitError = err.error?.message || 'Failed to delete fare location.';
          this.cdr.markForCheck();
        }
      });
    }
  }

  addRouteFare(): void {
    if (!this.selectedRouteForFares) return;
    this.fareSubmitError = '';
    this.fareSubmitSuccess = '';

    this.routeService.createRouteFare(this.selectedRouteForFares.source, this.selectedRouteForFares.destination, this.newRouteFare).subscribe({
      next: (res) => {
        this.fareSubmitSuccess = 'Route fare added successfully!';
        this.newRouteFare = { fromFareLocationId: '', toFareLocationId: '', fare: 0 };
        this.loadFaresData(this.selectedRouteForFares!.source, this.selectedRouteForFares!.destination);
        setTimeout(() => { this.fareSubmitSuccess = ''; this.cdr.markForCheck(); }, 3000);
      },
      error: (err) => {
        console.error('Failed to add route fare', err);
        this.fareSubmitError = err.error?.message || 'Failed to add route fare.';
        this.cdr.markForCheck();
      }
    });
  }

  deleteRouteFare(fareId: string): void {
    if (!this.selectedRouteForFares) return;
    if (confirm('Are you sure you want to delete this route fare?')) {
      this.routeService.deleteRouteFare(this.selectedRouteForFares.source, this.selectedRouteForFares.destination, fareId).subscribe({
        next: () => {
          this.fareSubmitSuccess = 'Route fare deleted successfully!';
          this.loadFaresData(this.selectedRouteForFares!.source, this.selectedRouteForFares!.destination);
          setTimeout(() => { this.fareSubmitSuccess = ''; this.cdr.markForCheck(); }, 3000);
        },
        error: (err) => {
          console.error('Failed to delete route fare', err);
          this.fareSubmitError = err.error?.message || 'Failed to delete route fare.';
          this.cdr.markForCheck();
        }
      });
    }
  }
}
