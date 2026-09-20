export interface Bus {
  tripId: string;
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  baseFare: number;
  isCancelled: boolean;
  cancellationReason: string;
  source: string;
  destination: string;
  busRegistrationNumber: string;
  busType: string;
  amenities: string[];
  operatorName: string;
  totalSeats: number;
  availableSeats: number;
  rating: number;
}

export interface BusDTO {
  busId: string;
  registrationNumber: string;
  busType: string;
  amenities: string[];
  isActive: boolean;
  operatorCompanyName: string;
  petsAllowed?: boolean;
  baggagePolicy?: string;
  lastTripDate?: string;
  activationRequestStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  activationRequestNote?: string;
  compensationAmount?: number;
  adminRejectionNote?: string;
  activationRequestedAt?: string;
  activationApprovedAt?: string;
}

export interface BusCreateRequest {
  registrationNumber: string;
  busType: string;
  amenities: string[];
  operatorCompanyName: string;
  petsAllowed?: boolean;
  baggagePolicy?: string;
}

export interface BusSeatDTO {
  busSeatId: string;
  seatNumber: string;
  seatPosition: string;
  isActive: boolean;
  busRegistrationNumber: string;
}

export interface BusSeatCreateRequest {
  seatNumber: string;
  seatPosition: string;
}
