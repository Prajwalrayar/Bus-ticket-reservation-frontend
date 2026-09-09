export interface TripSearchRequest {
  source: string;
  destination: string;
  fromLocationId?: number;
  toLocationId?: number;
  travelDate?: string; // YYYY-MM-DD
  busType?: string;
  minPrice?: number;
  maxPrice?: number;
  departureStart?: string; // HH:mm:ss
  departureEnd?: string; // HH:mm:ss
  isAc?: boolean;
}

export interface TripDTO {
  tripId: string;
  travelDate: string; // YYYY-MM-DD
  departureTime: string; // HH:mm:ss
  arrivalDate: string; // YYYY-MM-DD
  arrivalTime: string; // HH:mm:ss
  baseFare: number;
  segments?: TripSegmentDTO[];
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

export interface TripStopFareDTO {
  routeStopId: string;
  stopName: string;
  fareFromSource: number;
  stopSequence: number;
  stopType: string;
  stopTime?: string; // HH:mm:ss
  stopDate?: string; // YYYY-MM-DD
  fareLocationId?: string;
  fareLocationName?: string;
  canBoard?: boolean;
  canDrop?: boolean;
}

export interface TripSegmentDTO {
  id: string;
  tripId: string;
  boardingStopId: string;
  boardingStopName: string;
  boardingZoneName?: string;
  departureTime: string; // HH:mm:ss
  departureDate?: string;
  droppingStopId: string;
  droppingStopName: string;
  droppingZoneName?: string;
  arrivalTime: string; // HH:mm:ss
  arrivalDate?: string;
  fare: number;
}

export interface TripSegmentCreateRequest {
  boardingStopId: string;
  droppingStopId: string;
  departureTime: string; // HH:mm:ss
  arrivalTime: string; // HH:mm:ss
  departureDate?: string;
  arrivalDate?: string;
  fare: number;
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
  fareLocationId: string;
  fareLocationName?: string;
  canBoard?: boolean;
  canDrop?: boolean;
}

export interface RouteStopCreateRequest {
  stopName: string;
  stopSequence: number;
  stopType: StopType;
  distanceFromSourceKm: number;
  fareLocationId: string;
  canBoard?: boolean;
  canDrop?: boolean;
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
  segments?: TripSegmentCreateRequest[];
}

// ── FareLocation ──────────────────────────────────────────────

export interface FareLocationDTO {
  fareLocationId: string;
  name: string;
  description?: string;
  routeId: string;
  source: string;
  destination: string;
}

export interface FareLocationCreateRequest {
  name: string;
  description?: string;
}

// ── RouteFare ─────────────────────────────────────────────────

export interface RouteFareDTO {
  routeFareId: string;
  routeId: string;
  fromFareLocationId: string;
  fromFareLocationName: string;
  toFareLocationId: string;
  toFareLocationName: string;
  fare: number;
}

export interface RouteFareCreateRequest {
  fromFareLocationId: string;
  toFareLocationId: string;
  fare: number;
}
