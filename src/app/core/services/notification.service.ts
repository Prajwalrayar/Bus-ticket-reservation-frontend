import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { NotificationDTO } from '../models/notification';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/notifications';
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getMyNotifications(): Observable<NotificationDTO[]> {
    return this.http.get<ApiResponse<NotificationDTO[]>>(this.apiUrl)
      .pipe(
        map(res => res.data),
        tap(data => {
          const unread = data.filter(n => !n.isRead).length;
          this.unreadCountSubject.next(unread);
        })
      );
  }

  getMyUnreadNotifications(): Observable<NotificationDTO[]> {
    return this.http.get<ApiResponse<NotificationDTO[]>>(`${this.apiUrl}/unread`)
      .pipe(
        map(res => res.data),
        tap(data => this.unreadCountSubject.next(data.length))
      );
  }

  markAsRead(notificationId: string): Observable<NotificationDTO> {
    return this.http.patch<ApiResponse<NotificationDTO>>(`${this.apiUrl}/${notificationId}/read`, {})
      .pipe(
        map(res => res.data),
        tap(() => {
          const current = this.unreadCountSubject.value;
          if (current > 0) this.unreadCountSubject.next(current - 1);
        })
      );
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/read-all`, {})
      .pipe(
        map(() => void 0),
        tap(() => this.unreadCountSubject.next(0))
      );
  }
}
