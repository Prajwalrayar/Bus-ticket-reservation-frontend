import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationDTO } from '../models/notification';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/notifications';

  constructor(private http: HttpClient) {}

  getMyNotifications(): Observable<NotificationDTO[]> {
    return this.http.get<ApiResponse<NotificationDTO[]>>(this.apiUrl)
      .pipe(map(res => res.data));
  }

  getMyUnreadNotifications(): Observable<NotificationDTO[]> {
    return this.http.get<ApiResponse<NotificationDTO[]>>(`${this.apiUrl}/unread`)
      .pipe(map(res => res.data));
  }

  markAsRead(notificationId: string): Observable<NotificationDTO> {
    return this.http.patch<ApiResponse<NotificationDTO>>(`${this.apiUrl}/${notificationId}/read`, {})
      .pipe(map(res => res.data));
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/read-all`, {})
      .pipe(map(() => void 0));
  }
}
