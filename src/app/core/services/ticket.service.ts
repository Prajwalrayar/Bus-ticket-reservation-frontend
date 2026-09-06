import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { TicketDTO } from '../models/ticket';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = '/api/tickets';

  constructor(private http: HttpClient) {}

  getTicketById(ticketId: string): Observable<ApiResponse<TicketDTO>> {
    return this.http.get<ApiResponse<TicketDTO>>(`${this.apiUrl}/${ticketId}`);
  }

  getTicketByNumber(ticketNumber: string): Observable<ApiResponse<TicketDTO>> {
    return this.http.get<ApiResponse<TicketDTO>>(`${this.apiUrl}/number/${ticketNumber}`);
  }

  getTicketByBooking(bookingId: string): Observable<ApiResponse<TicketDTO>> {
    return this.http.get<ApiResponse<TicketDTO>>(`${this.apiUrl}/booking/${bookingId}`);
  }

  getTicketQrCodeUrl(ticketNumber: string): string {
    return `${this.apiUrl}/${ticketNumber}/qr`;
  }
}
