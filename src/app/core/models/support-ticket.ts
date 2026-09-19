export enum SupportTicketStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_PASSENGER = 'WAITING_FOR_PASSENGER',
  PASSENGER_REPLIED = 'PASSENGER_REPLIED',
  RESOLVED = 'RESOLVED'
}

export enum SupportTicketPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface SupportTicketMessageDTO {
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface SupportTicketDTO {
  ticketId: string;
  issueCategory: string;
  issueType: string;
  issueSubject: string;
  issueDescription: string;
  attachmentPath?: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  resolvedAt?: string;
  bookingReference?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  operatorId: string;
  operatorName: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketWithMessagesDTO extends SupportTicketDTO {
  messages: SupportTicketMessageDTO[];
}

export interface SupportTicketCreateRequest {
  issueCategory: string;
  issueType: string;
  issueSubject: string;
  issueDescription: string;
  operatorId: string;
  bookingReference?: string;
}

export interface SupportTicketUpdateRequest {
  status: SupportTicketStatus;
}

export interface SupportTicketReplyRequest {
  message: string;
  isInternal: boolean;
}
