import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TripSeatDTO } from '../models/seat';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class SeatService {
  
  constructor(private http: HttpClient) {}

  getTripSeats(tripId: string): Observable<ApiResponse<TripSeatDTO[]>> {
    return this.http.get<ApiResponse<TripSeatDTO[]>>(`/api/trips/${tripId}/seats`);
  }

  lockSeats(tripId: string, seatIds: string[]): Observable<ApiResponse<TripSeatDTO[]>> {
    return this.http.post<ApiResponse<TripSeatDTO[]>>(`/api/trips/${tripId}/seats/lock`, seatIds);
  }

  releaseSeats(tripId: string, seatIds: string[]): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`/api/trips/${tripId}/seats/release`, seatIds);
  }
}
