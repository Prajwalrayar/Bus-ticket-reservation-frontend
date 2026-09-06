export enum SupportTicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

export interface SupportTicketDTO {
  ticketId: string;
  issueSubject: string;
  issueDescription: string;
  status: SupportTicketStatus;
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

export interface SupportTicketCreateRequest {
  issueSubject: string;
  issueDescription: string;
  operatorId: string;
  bookingReference?: string;
}

export interface SupportTicketUpdateRequest {
  status: SupportTicketStatus;
}
