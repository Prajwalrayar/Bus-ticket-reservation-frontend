import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CancellationRequest, CancellationDTO } from '../models/cancellation';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class CancellationService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  cancelBooking(bookingId: string, request: CancellationRequest): Observable<CancellationDTO> {
    return this.http.post<ApiResponse<CancellationDTO>>(`${this.apiUrl}/bookings/${bookingId}/cancellation`, request)
      .pipe(map(res => res.data));
  }

  getCancellationById(cancellationId: string): Observable<CancellationDTO> {
    return this.http.get<ApiResponse<CancellationDTO>>(`${this.apiUrl}/cancellations/${cancellationId}`)
      .pipe(map(res => res.data));
  }

  getCancellationByBooking(bookingId: string): Observable<CancellationDTO> {
    return this.http.get<ApiResponse<CancellationDTO>>(`${this.apiUrl}/bookings/${bookingId}/cancellation`)
      .pipe(map(res => res.data));
  }
}
