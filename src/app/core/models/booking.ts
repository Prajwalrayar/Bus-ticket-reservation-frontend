import { BookingSeat } from './booking-seat';
import { Passenger } from './passenger';

export interface BookingCreateRequest {
  tripId: string;
  boardingPointId: string;
  droppingPointId: string;
  passengers: Passenger[];
  offerCode?: string;
  isInsured?: boolean;
}

export interface BookingCancelRequest {
  cancellationReason: string;
}

export interface Booking {

  bookingId: string;

  bookingReference: string;

  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

  totalSeats: number;

  baseFareTotal: number;

  discountAmount: number;

  taxAmount: number;

  insuranceAmount: number;

  totalAmount: number;

  createdAt: string;

  boardingPointName: string;

  droppingPointName: string;

  userId: string;
  
  userName?: string;
  
  userEmail?: string;

  tripId: string;

  bookingSeats: BookingSeat[];

}
