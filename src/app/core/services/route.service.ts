import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RouteDTO, RouteCreateRequest } from '../models/route';
import { RouteStopDTO, RouteStopCreateRequest } from '../models/trip';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private apiUrl = '/api/routes';

  constructor(private http: HttpClient) {}

  getAllRoutes(): Observable<RouteDTO[]> {
    return this.http.get<ApiResponse<RouteDTO[]>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  getRoute(source: string, destination: string): Observable<RouteDTO> {
    return this.http.get<ApiResponse<RouteDTO>>(`${this.apiUrl}/search`, {
      params: new HttpParams().set('source', source).set('destination', destination)
    }).pipe(map(res => res.data));
  }

  createRoute(request: RouteCreateRequest): Observable<RouteDTO> {
    return this.http.post<ApiResponse<RouteDTO>>(this.apiUrl, request).pipe(
      map(res => res.data)
    );
  }

  updateRoute(source: string, destination: string, request: RouteCreateRequest): Observable<RouteDTO> {
    return this.http.put<ApiResponse<RouteDTO>>(this.apiUrl, request, {
      params: new HttpParams().set('source', source).set('destination', destination)
    }).pipe(map(res => res.data));
  }

  deactivateRoute(source: string, destination: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/deactivate`, {}, {
      params: new HttpParams().set('source', source).set('destination', destination)
    }).pipe(map(() => void 0));
  }

  getRouteStops(source: string, destination: string): Observable<RouteStopDTO[]> {
    return this.http.get<ApiResponse<RouteStopDTO[]>>(`${this.apiUrl}/${source}/${destination}/stops`).pipe(
      map(res => res.data)
    );
  }

  addRouteStop(source: string, destination: string, request: RouteStopCreateRequest): Observable<RouteStopDTO> {
    return this.http.post<ApiResponse<RouteStopDTO>>(`${this.apiUrl}/${source}/${destination}/stops`, request).pipe(
      map(res => res.data)
    );
  }
}
