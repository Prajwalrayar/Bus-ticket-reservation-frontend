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
}
