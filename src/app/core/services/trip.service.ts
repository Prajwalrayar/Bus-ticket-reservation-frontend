import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TripDTO, TripSearchRequest, RouteStopDTO, TripCreateRequest } from '../models/trip';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private apiUrl = '/api/trips';

  constructor(private http: HttpClient) {}

  searchTrips(request: TripSearchRequest): Observable<ApiResponse<TripDTO[]>> {
    let params = new HttpParams()
      .set('source', request.source)
      .set('destination', request.destination);

    if (request.travelDate) {
      params = params.set('travelDate', request.travelDate);
    }
    if (request.busType) {
      params = params.set('busType', request.busType);
    }
    if (request.minPrice) {
      params = params.set('minPrice', request.minPrice.toString());
    }
    if (request.maxPrice) {
      params = params.set('maxPrice', request.maxPrice.toString());
    }
    if (request.departureStart) {
      params = params.set('departureStart', request.departureStart);
    }
    if (request.departureEnd) {
      params = params.set('departureEnd', request.departureEnd);
    }

    return this.http.get<ApiResponse<TripDTO[]>>(`${this.apiUrl}/search`, { params });
  }

  getTripById(tripId: string): Observable<ApiResponse<TripDTO>> {
    return this.http.get<ApiResponse<TripDTO>>(`${this.apiUrl}/${tripId}`);
  }

  getRouteStops(source: string, destination: string): Observable<ApiResponse<RouteStopDTO[]>> {
    return this.http.get<ApiResponse<RouteStopDTO[]>>(`/api/routes/${source}/${destination}/stops`);
  }

  // ==========================================
  // ADMIN OPERATIONS
  // ==========================================

  getAllTrips(): Observable<TripDTO[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  createTrip(request: TripCreateRequest): Observable<TripDTO> {
    return this.http.post<any>(this.apiUrl, request).pipe(
      map(res => res.data)
    );
  }

  updateTrip(
    busRegistrationNumber: string,
    source: string,
    destination: string,
    travelDate: string,
    request: TripCreateRequest
  ): Observable<TripDTO> {
    let params = new HttpParams()
      .set('busRegistrationNumber', busRegistrationNumber)
      .set('source', source)
      .set('destination', destination)
      .set('travelDate', travelDate);
    return this.http.put<any>(this.apiUrl, request, { params }).pipe(
      map(res => res.data)
    );
  }

  cancelTrip(
    busRegistrationNumber: string,
    source: string,
    destination: string,
    travelDate: string,
    reason: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('busRegistrationNumber', busRegistrationNumber)
      .set('source', source)
      .set('destination', destination)
      .set('travelDate', travelDate)
      .set('reason', reason);
    return this.http.patch<any>(`${this.apiUrl}/cancel`, {}, { params }).pipe(
      map(res => res.data)
    );
  }
}
