export interface TripSearchRequest {
  source: string;
  destination: string;
  travelDate?: string; // YYYY-MM-DD
  busType?: string;
  minPrice?: number;
  maxPrice?: number;
  departureStart?: string; // HH:mm:ss
  departureEnd?: string; // HH:mm:ss
}

export interface TripDTO {
  tripId: string;
  travelDate: string; // YYYY-MM-DD
  departureTime: string; // HH:mm:ss
  arrivalDate: string; // YYYY-MM-DD
  arrivalTime: string; // HH:mm:ss
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
}

export type StopType = 'BOARDING' | 'DROPPING' | 'INTERMEDIATE';

export interface RouteStopDTO {
  routeStopId: string;
  stopName: string;
  stopSequence: number;
  stopType: StopType;
  distanceFromSourceKm: number;
  source: string;
  destination: string;
}

export interface RouteStopCreateRequest {
  stopName: string;
  stopSequence: number;
  stopType: StopType;
  distanceFromSourceKm: number;
}

export interface TripCreateRequest {
  busRegistrationNumber: string;
  source: string;
  destination: string;
  travelDate: string; // YYYY-MM-DD
  arrivalDate: string; // YYYY-MM-DD
  departureTime: string; // HH:MM:SS or HH:MM
  arrivalTime: string; // HH:MM:SS or HH:MM
  baseFare: number;
}
