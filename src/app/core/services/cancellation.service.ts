import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CancellationRequest, CancellationDTO } from '../models/cancellation';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class CancellationService {
  private apiUrl = '/api';
  private pendingRefundsCountSubject = new BehaviorSubject<number>(0);
  public pendingRefundsCount$ = this.pendingRefundsCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  cancelBooking(bookingId: string, request: CancellationRequest): Observable<CancellationDTO> {
    return this.http.post<ApiResponse<CancellationDTO>>(`${this.apiUrl}/bookings/${bookingId}/cancellation`, request)
      .pipe(map(res => res.data));
  }

  getCancellationEstimate(bookingId: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/bookings/${bookingId}/cancellation-estimate`)
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

  getPendingRefunds(): Observable<CancellationDTO[]> {
    return this.http.get<ApiResponse<CancellationDTO[]>>(`${this.apiUrl}/cancellations/pending`)
      .pipe(
        map(res => res.data),
        tap(data => {
          const pendingCount = data.filter(r => r.refundStatus !== 'COMPLETED').length;
          this.pendingRefundsCountSubject.next(pendingCount);
        })
      );
  }

  processRefund(cancellationId: string): Observable<CancellationDTO> {
    return this.http.put<ApiResponse<CancellationDTO>>(`${this.apiUrl}/cancellations/${cancellationId}/refund`, {})
      .pipe(
        map(response => response.data),
        tap(() => {
          const current = this.pendingRefundsCountSubject.value;
          if (current > 0) this.pendingRefundsCountSubject.next(current - 1);
        })
      );
  }
}
