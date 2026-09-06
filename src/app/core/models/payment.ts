export enum PaymentStatus {
  INITIATED = 'INITIATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface PaymentRequest {
  paymentMethod: string;
}

export interface PaymentDTO {
  paymentId: string;
  transactionReference: string;
  gatewayTransactionId: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  failureReason: string;
  paymentInitiatedAt: string;
  paymentCompletedAt: string;
  refundInitiatedAt: string;
  refundCompletedAt: string;
  refundReference: string;
  bookingId: string;
  bookingReference: string;
}
