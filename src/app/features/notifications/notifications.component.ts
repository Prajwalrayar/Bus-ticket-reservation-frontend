import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationDTO } from '../../core/models/notification';

@Component({
  selector: 'app-notifications',
  standalone: false,
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationDTO[] = [];
  loading: boolean = true;
  error: string = '';

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.fetchNotifications();
  }

  fetchNotifications(): void {
    this.loading = true;
    this.notificationService.getMyNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load notifications.';
        this.loading = false;
      }
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  markAsRead(notification: NotificationDTO): void {
    if (notification.isRead) return;
    
    this.notificationService.markAsRead(notification.notificationId).subscribe({
      next: (updated) => {
        const index = this.notifications.findIndex(n => n.notificationId === notification.notificationId);
        if (index !== -1) {
          this.notifications[index] = updated;
        }
      },
      error: (err) => console.error('Failed to mark notification as read', err)
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => {
          n.isRead = true;
        });
      },
      error: (err) => console.error('Failed to mark all as read', err)
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return 'bi-check-circle-fill text-success';
      case 'PAYMENT_SUCCESSFUL':
        return 'bi-currency-rupee text-success';
      case 'TICKET_GENERATED':
        return 'bi-ticket-detailed-fill text-primary';
      case 'BOOKING_CANCELLED':
        return 'bi-x-circle-fill text-danger';
      case 'REFUND_PROCESSED':
        return 'bi-arrow-return-left text-warning';
      case 'TRIP_NOTIFICATION':
        return 'bi-info-circle-fill text-info';
      default:
        return 'bi-bell-fill text-secondary';
    }
  }
}
