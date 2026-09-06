import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouteService } from '../../../core/services/route.service';
import { RouteDTO, RouteCreateRequest } from '../../../core/models/route';
import { RouteStopDTO, RouteStopCreateRequest, StopType } from '../../../core/models/trip';

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
    distanceFromSourceKm: 0
  };
  stopSubmitSuccess: string = '';
  stopSubmitError: string = '';

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

  resetNewStop(): void {
    this.newStop = {
      stopName: '',
      stopSequence: (this.routeStops.length + 1),
      stopType: 'BOARDING',
      distanceFromSourceKm: 0
    };
  }

  loadStopsForRoute(source: string, destination: string): void {
    this.loadingStops = true;
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
  }

  saveStop(): void {
    if (!this.selectedRouteForStops) return;
    this.stopSubmitError = '';
    this.stopSubmitSuccess = '';
    
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

  isSequenceValid(): boolean {
    if (this.newStop.stopSequence == null || this.newStop.stopSequence < 1) return false;
    // ensure sequence is unique for this route per StopType
    return !this.routeStops.some(s => 
      s.stopSequence === this.newStop.stopSequence && 
      (s.stopType === this.newStop.stopType || s.stopType === 'INTERMEDIATE' || this.newStop.stopType === 'INTERMEDIATE')
    );
  }

  isDistanceValid(): boolean {
    if (this.newStop.distanceFromSourceKm == null || this.newStop.distanceFromSourceKm < 0) return false;
    if (!this.selectedRouteForStops) return false;
    // distance must be <= total route distance
    return this.newStop.distanceFromSourceKm <= this.selectedRouteForStops.distance;
  }
}
