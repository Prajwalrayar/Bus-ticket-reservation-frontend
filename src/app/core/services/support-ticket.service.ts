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

  createTicket(formData: FormData): Observable<SupportTicketDTO> {
    return this.http.post<ApiResponse<SupportTicketDTO>>(this.apiUrl, formData)
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
          if (request.status === SupportTicketStatus.RESOLVED) {
             const current = this.openTicketsCountSubject.value;
             if (current > 0) this.openTicketsCountSubject.next(current - 1);
          }
        })
      );
  }

  getTicketWithMessages(ticketId: string): Observable<import('../models/support-ticket').SupportTicketWithMessagesDTO> {
    return this.http.get<ApiResponse<import('../models/support-ticket').SupportTicketWithMessagesDTO>>(`${this.apiUrl}/${ticketId}`)
      .pipe(map(response => response.data));
  }

  addMessage(ticketId: string, request: import('../models/support-ticket').SupportTicketReplyRequest): Observable<import('../models/support-ticket').SupportTicketMessageDTO> {
    return this.http.post<ApiResponse<import('../models/support-ticket').SupportTicketMessageDTO>>(`${this.apiUrl}/${ticketId}/messages`, request)
      .pipe(map(response => response.data));
  }

  resolveTicket(ticketId: string): Observable<SupportTicketDTO> {
    return this.http.patch<ApiResponse<SupportTicketDTO>>(`${this.apiUrl}/${ticketId}/resolve`, {})
      .pipe(
        map(response => response.data),
        tap(() => {
           const current = this.openTicketsCountSubject.value;
           if (current > 0) this.openTicketsCountSubject.next(current - 1);
        })
      );
  }
}
