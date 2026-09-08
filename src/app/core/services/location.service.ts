import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocationDTO } from '../models/location';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = 'http://localhost:8080/api/locations';

  constructor(private http: HttpClient) {}

  getSuggestions(query: string): Observable<ApiResponse<LocationDTO[]>> {
    const params = new HttpParams().set('query', query);
    return this.http.get<ApiResponse<LocationDTO[]>>(`${this.apiUrl}/suggestions`, { params });
  }

  // --- Admin Methods ---
  private adminUrl = 'http://localhost:8080/api/admin/locations';

  getAllAdminLocations(): Observable<ApiResponse<import('../models/location').AdminLocationDTO[]>> {
    return this.http.get<ApiResponse<import('../models/location').AdminLocationDTO[]>>(this.adminUrl);
  }

  createLocation(name: string): Observable<ApiResponse<import('../models/location').AdminLocationDTO>> {
    return this.http.post<ApiResponse<import('../models/location').AdminLocationDTO>>(this.adminUrl, { name });
  }

  updateLocationName(locationId: number, name: string): Observable<ApiResponse<import('../models/location').AdminLocationDTO>> {
    return this.http.put<ApiResponse<import('../models/location').AdminLocationDTO>>(`${this.adminUrl}/${locationId}`, { name });
  }

  updateLocationStatus(locationId: number, isActive: boolean): Observable<ApiResponse<import('../models/location').AdminLocationDTO>> {
    return this.http.patch<ApiResponse<import('../models/location').AdminLocationDTO>>(`${this.adminUrl}/${locationId}/status`, { isActive });
  }

  getAliasesForLocation(locationId: number): Observable<ApiResponse<import('../models/location').AdminLocationAliasDTO[]>> {
    return this.http.get<ApiResponse<import('../models/location').AdminLocationAliasDTO[]>>(`${this.adminUrl}/${locationId}/aliases`);
  }

  createAlias(locationId: number, alias: string): Observable<ApiResponse<import('../models/location').AdminLocationAliasDTO>> {
    return this.http.post<ApiResponse<import('../models/location').AdminLocationAliasDTO>>(`${this.adminUrl}/${locationId}/aliases`, { alias });
  }

  updateAliasName(locationId: number, aliasId: number, alias: string): Observable<ApiResponse<import('../models/location').AdminLocationAliasDTO>> {
    return this.http.put<ApiResponse<import('../models/location').AdminLocationAliasDTO>>(`${this.adminUrl}/${locationId}/aliases/${aliasId}`, { alias });
  }

  updateAliasStatus(locationId: number, aliasId: number, isActive: boolean): Observable<ApiResponse<import('../models/location').AdminLocationAliasDTO>> {
    return this.http.patch<ApiResponse<import('../models/location').AdminLocationAliasDTO>>(`${this.adminUrl}/${locationId}/aliases/${aliasId}/status`, { isActive });
  }
}
