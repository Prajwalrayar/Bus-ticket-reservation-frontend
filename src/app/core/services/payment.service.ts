import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { PaymentDTO, PaymentRequest } from '../models/payment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = '/api/payments';

  constructor(private http: HttpClient) {}

  mockCheckout(bookingId: string, request: PaymentRequest): Observable<ApiResponse<PaymentDTO>> {
    return this.http.post<ApiResponse<PaymentDTO>>(`${this.apiUrl}/mock-checkout`, request, {
      params: { bookingId }
    });
  }

  getPaymentsByBooking(bookingId: string): Observable<ApiResponse<PaymentDTO[]>> {
    return this.http.get<ApiResponse<PaymentDTO[]>>(`/api/bookings/${bookingId}/payments`);
  }

  createRazorpayOrder(bookingId: string, request: PaymentRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`/api/bookings/${bookingId}/payments/razorpay/create-order`, request);
  }

  verifyRazorpayPayment(bookingId: string, request: any): Observable<ApiResponse<PaymentDTO>> {
    return this.http.post<ApiResponse<PaymentDTO>>(`/api/bookings/${bookingId}/payments/razorpay/verify`, request);
  }
}
