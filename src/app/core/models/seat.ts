export type SeatPosition = 'WINDOW' | 'AISLE' | 'MIDDLE' | 'LOWER_BERTH' | 'UPPER_BERTH';
export type SeatStatus = 'AVAILABLE' | 'BOOKED' | 'TEMPORARILY_LOCKED';

export interface TripSeatDTO {
  tripSeatId: string;
  seatNumber: string;
  seatPosition: SeatPosition;
  seatStatus: SeatStatus;
  seatFare: number;
  lockExpiryTime?: string; // ISO DateTime
}
