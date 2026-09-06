import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupportTicketDTO, SupportTicketCreateRequest, SupportTicketUpdateRequest } from '../models/support-ticket';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class SupportTicketService {
  private apiUrl = '/api/support-tickets';

  constructor(private http: HttpClient) {}

  createTicket(request: SupportTicketCreateRequest): Observable<SupportTicketDTO> {
    return this.http.post<ApiResponse<SupportTicketDTO>>(this.apiUrl, request)
      .pipe(map(response => response.data));
  }

  getMyTickets(): Observable<SupportTicketDTO[]> {
    return this.http.get<ApiResponse<SupportTicketDTO[]>>(`${this.apiUrl}/my`)
      .pipe(map(response => response.data));
  }

  getTicketsByOperator(): Observable<SupportTicketDTO[]> {
    return this.http.get<ApiResponse<SupportTicketDTO[]>>(`${this.apiUrl}/operator`)
      .pipe(map(response => response.data));
  }

  getAllTickets(): Observable<SupportTicketDTO[]> {
    return this.http.get<ApiResponse<SupportTicketDTO[]>>(this.apiUrl)
      .pipe(map(response => response.data));
  }

  updateTicketStatus(ticketId: string, request: SupportTicketUpdateRequest): Observable<SupportTicketDTO> {
    return this.http.patch<ApiResponse<SupportTicketDTO>>(`${this.apiUrl}/${ticketId}/status`, request)
      .pipe(map(response => response.data));
  }
}
