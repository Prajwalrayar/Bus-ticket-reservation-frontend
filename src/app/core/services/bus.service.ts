import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Bus } from '../models/bus';
import { TripSeatDTO as Seat } from '../models/seat';


@Injectable({
  providedIn: 'root',
})
export class BusService {

  private apiUrl = '/api';

  constructor(
    private http: HttpClient
  ) { }


  // ==========================================================
  // SEARCH TRIPS
  // ==========================================================

  searchBuses(
    fromCity: string,
    toCity: string,
    travelDate?: string
  ): Observable<Bus[]> {

    let params = new HttpParams()
      .set('source', fromCity)
      .set('destination', toCity);


    if (travelDate) {

      params = params.set(
        'travelDate',
        travelDate
      );

    }


    return this.http.get<Bus[]>(
      `${this.apiUrl}/trips`,
      { params }
    );

  }


  // ==========================================================
  // GET TRIP BY ID
  // ==========================================================

  getTripById(
    tripId: string
  ): Observable<Bus> {

    return this.http.get<Bus>(
      `${this.apiUrl}/trips/${tripId}`
    );

  }


  // ==========================================================
  // GET SEATS BY TRIP ID
  // ==========================================================

  getSeatsByTripId(
    tripId: string
  ): Observable<Seat[]> {

    return this.http.get<Seat[]>(
      `${this.apiUrl}/tripSeats`,
      {
        params: {
          tripId
        }
      }
    );

  }

  // ==========================================================
  // ADMIN FLEET MANAGEMENT
  // ==========================================================

  getAllBuses(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/buses`).pipe(
      map(res => res.data)
    );
  }

  getBusByRegistrationNumber(registrationNumber: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/buses/${registrationNumber}`).pipe(
      map(res => res.data)
    );
  }

  getBusesByOperator(companyName: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/buses/operator/${companyName}`).pipe(
      map(res => res.data)
    );
  }

  createBus(request: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/buses`, request).pipe(
      map(res => res.data)
    );
  }

  updateBus(registrationNumber: string, request: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/buses/${registrationNumber}`, request).pipe(
      map(res => res.data)
    );
  }

  deactivateBus(registrationNumber: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/buses/${registrationNumber}/deactivate`, {}).pipe(
      map(res => res.data)
    );
  }

  // ==========================================================
  // ADMIN BUS SEATS MANAGEMENT
  // ==========================================================

  getSeatsByBus(registrationNumber: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/buses/${registrationNumber}/seats`).pipe(
      map(res => res.data)
    );
  }

  createBusSeat(registrationNumber: string, request: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/buses/${registrationNumber}/seats`, request).pipe(
      map(res => res.data)
    );
  }

  updateBusSeat(registrationNumber: string, seatNumber: string, request: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/buses/${registrationNumber}/seats/${seatNumber}`, request).pipe(
      map(res => res.data)
    );
  }

  deactivateBusSeat(registrationNumber: string, seatNumber: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/buses/${registrationNumber}/seats/${seatNumber}/deactivate`, {}).pipe(
      map(res => res.data)
    );
  }

}