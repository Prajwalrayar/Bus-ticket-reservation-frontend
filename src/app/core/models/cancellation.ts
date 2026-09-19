export interface CancellationRequest {
  cancellationReason: string;
}

export interface CancellationDTO {
  cancellationId: string;
  cancellationReference: string;
  cancellationReason: string;
  cancellationFee: number;
  refundAmount: number;
  refundStatus: string;
  refundReference: string;
  cancelledAt: string;
  refundCompletedAt: string;
  bookingId: string;
  cancelledByUserId: string;
  paymentTransactionId?: string;
  ruleApplied: string;
  paymentMethod?: string;
  paymentProvider?: string;
  refundDestination?: string;
}

export interface CancellationEstimateDTO {
  bookingId: string;
  totalAmount: number;
  cancellationFeePercentage: number;
  cancellationFee: number;
  refundAmount: number;
  ruleApplied: string;
  paymentMethod?: string;
  paymentProvider?: string;
  refundDestination?: string;
}
