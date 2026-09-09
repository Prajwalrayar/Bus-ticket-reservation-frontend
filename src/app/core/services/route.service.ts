import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RouteDTO, RouteCreateRequest } from '../models/route';
import { RouteStopDTO, RouteStopCreateRequest, FareLocationDTO, FareLocationCreateRequest, RouteFareDTO, RouteFareCreateRequest } from '../models/trip';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private apiUrl = '/api/routes';

  constructor(private http: HttpClient) {}

  getAllRoutes(): Observable<RouteDTO[]> {
    return this.http.get<ApiResponse<RouteDTO[]>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  getRoute(source: string, destination: string): Observable<RouteDTO> {
    return this.http.get<ApiResponse<RouteDTO>>(`${this.apiUrl}/search`, {
      params: new HttpParams().set('source', source).set('destination', destination)
    }).pipe(map(res => res.data));
  }

  createRoute(request: RouteCreateRequest): Observable<RouteDTO> {
    return this.http.post<ApiResponse<RouteDTO>>(this.apiUrl, request).pipe(
      map(res => res.data)
    );
  }

  updateRoute(source: string, destination: string, request: RouteCreateRequest): Observable<RouteDTO> {
    return this.http.put<ApiResponse<RouteDTO>>(this.apiUrl, request, {
      params: new HttpParams().set('source', source).set('destination', destination)
    }).pipe(map(res => res.data));
  }

  deactivateRoute(source: string, destination: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/deactivate`, {}, {
      params: new HttpParams().set('source', source).set('destination', destination)
    }).pipe(map(() => void 0));
  }

  getRouteStops(source: string, destination: string): Observable<RouteStopDTO[]> {
    return this.http.get<ApiResponse<RouteStopDTO[]>>(`${this.apiUrl}/${source}/${destination}/stops`).pipe(
      map(res => res.data)
    );
  }

  addRouteStop(source: string, destination: string, request: RouteStopCreateRequest): Observable<RouteStopDTO> {
    return this.http.post<ApiResponse<RouteStopDTO>>(`${this.apiUrl}/${source}/${destination}/stops`, request).pipe(
      map(res => res.data)
    );
  }

  updateRouteStop(source: string, destination: string, stopName: string, request: RouteStopCreateRequest): Observable<RouteStopDTO> {
    return this.http.put<ApiResponse<RouteStopDTO>>(`${this.apiUrl}/${source}/${destination}/stops/${stopName}`, request).pipe(
      map(res => res.data)
    );
  }

  // ── Fare Locations ──────────────────────────────────────────────

  getFareLocations(source: string, destination: string): Observable<FareLocationDTO[]> {
    return this.http.get<ApiResponse<FareLocationDTO[]>>(`${this.apiUrl}/${source}/${destination}/fare-locations`).pipe(
      map(res => res.data)
    );
  }

  createFareLocation(source: string, destination: string, request: FareLocationCreateRequest): Observable<FareLocationDTO> {
    return this.http.post<ApiResponse<FareLocationDTO>>(`${this.apiUrl}/${source}/${destination}/fare-locations`, request).pipe(
      map(res => res.data)
    );
  }

  deleteFareLocation(source: string, destination: string, fareLocationId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${source}/${destination}/fare-locations/${fareLocationId}`).pipe(
      map(() => void 0)
    );
  }

  // ── Route Fares ─────────────────────────────────────────────────

  getRouteFares(source: string, destination: string): Observable<RouteFareDTO[]> {
    return this.http.get<ApiResponse<RouteFareDTO[]>>(`${this.apiUrl}/${source}/${destination}/route-fares`).pipe(
      map(res => res.data)
    );
  }

  createRouteFare(source: string, destination: string, request: RouteFareCreateRequest): Observable<RouteFareDTO> {
    return this.http.post<ApiResponse<RouteFareDTO>>(`${this.apiUrl}/${source}/${destination}/route-fares`, request).pipe(
      map(res => res.data)
    );
  }

  deleteRouteFare(source: string, destination: string, routeFareId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${source}/${destination}/route-fares/${routeFareId}`).pipe(
      map(() => void 0)
    );
  }
}
