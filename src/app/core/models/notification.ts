export interface NotificationDTO {
  notificationId: string;
  notificationType: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
