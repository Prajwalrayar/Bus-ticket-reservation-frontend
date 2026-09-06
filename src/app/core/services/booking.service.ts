import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Booking, BookingCreateRequest, BookingCancelRequest } from '../models/booking';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = '/api/bookings';

  constructor(private http: HttpClient) { }

  createBooking(
  booking: BookingCreateRequest
): Observable<Booking> {

  return this.http
    .post<ApiResponse<Booking>>(
      this.apiUrl,
      booking
    )
    .pipe(
      map(res => res.data)
    );

}

  getBookingById(bookingId: string): Observable<Booking> {
    return this.http.get<ApiResponse<Booking>>(`${this.apiUrl}/${bookingId}`)
      .pipe(map(res => res.data));
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http.get<ApiResponse<Booking[]>>(`${this.apiUrl}/my`)
      .pipe(map(res => res.data));
  }

  getAllBookings(): Observable<Booking[]> {
    return this.http.get<ApiResponse<Booking[]>>(`${this.apiUrl}`)
      .pipe(map(res => res.data));
  }

  getBookingByReference(ref: string): Observable<Booking> {
    return this.http.get<ApiResponse<Booking>>(`${this.apiUrl}/reference/${ref}`)
      .pipe(map(res => res.data));
  }

  cancelBooking(bookingId: string, request: BookingCancelRequest): Observable<Booking> {
    return this.http.post<ApiResponse<Booking>>(`${this.apiUrl}/${bookingId}/cancel`, request)
      .pipe(map(res => res.data));
  }
}

