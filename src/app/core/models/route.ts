export interface RouteDTO {
  routeId: string;
  source: string;
  destination: string;
  distance: number;
  isActive: boolean;
}

export interface RouteCreateRequest {
  source: string;
  destination: string;
  distance: number;
}

export interface RouteStopDTO {
  routeStopId: string;
  stopName: string;
  stopSequence: number;
  stopType: string;
  distanceFromSourceKm: number;
  source: string;
  destination: string;
}

export interface RouteStopCreateRequest {
  stopName: string;
  stopSequence: number;
  stopType: string;
  distanceFromSourceKm: number;
}
