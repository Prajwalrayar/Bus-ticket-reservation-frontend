import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SupportTicketDTO, SupportTicketCreateRequest, SupportTicketUpdateRequest, SupportTicketStatus } from '../models/support-ticket';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class SupportTicketService {
  private apiUrl = '/api/support-tickets';
  
  private openTicketsCountSubject = new BehaviorSubject<number>(0);
  public openTicketsCount$ = this.openTicketsCountSubject.asObservable();

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
      .pipe(
        map(response => response.data),
        tap(tickets => {
          const openCount = tickets.filter(t => t.status === SupportTicketStatus.OPEN || t.status === SupportTicketStatus.IN_PROGRESS).length;
          this.openTicketsCountSubject.next(openCount);
        })
      );
  }

  getAllTickets(): Observable<SupportTicketDTO[]> {
    return this.http.get<ApiResponse<SupportTicketDTO[]>>(this.apiUrl)
      .pipe(map(response => response.data));
  }

  updateTicketStatus(ticketId: string, request: SupportTicketUpdateRequest): Observable<SupportTicketDTO> {
    return this.http.patch<ApiResponse<SupportTicketDTO>>(`${this.apiUrl}/${ticketId}/status`, request)
      .pipe(
        map(response => response.data),
        tap(updatedTicket => {
          // Instead of accurately guessing the delta, we can just trigger a refresh of the count in the dashboard
          // But a simple delta is: if it was just closed/resolved, we probably should decrement
          if (request.status === SupportTicketStatus.RESOLVED || request.status === SupportTicketStatus.CLOSED) {
             const current = this.openTicketsCountSubject.value;
             if (current > 0) this.openTicketsCountSubject.next(current - 1);
          }
        })
      );
  }
}
