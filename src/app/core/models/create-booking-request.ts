import { Passenger } from './passenger';

export interface CreateBookingRequest {

  userId: string;

  tripId: string;

  journeyDate: string;

  seatNumbers: string[];

  passengers: Passenger[];

  boardingPointName: string;

  droppingPointName: string;

  discountAmount: number;

  taxAmount: number;

  insuranceAmount: number;

  totalAmount: number;

  paymentMethod: string;

}