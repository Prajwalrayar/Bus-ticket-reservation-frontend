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
}
