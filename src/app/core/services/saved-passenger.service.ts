import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SavedPassengerDTO, SavedPassengerRequest } from '../models/saved-passenger';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class SavedPassengerService {
  private apiUrl = '/api/saved-passengers';

  constructor(private http: HttpClient) {}

  getMySavedPassengers(): Observable<SavedPassengerDTO[]> {
    return this.http.get<ApiResponse<SavedPassengerDTO[]>>(this.apiUrl)
      .pipe(map(res => res.data));
  }

  getMySavedPassenger(savedPassengerId: string): Observable<SavedPassengerDTO> {
    return this.http.get<ApiResponse<SavedPassengerDTO>>(`${this.apiUrl}/${savedPassengerId}`)
      .pipe(map(res => res.data));
  }

  createSavedPassenger(request: SavedPassengerRequest): Observable<SavedPassengerDTO> {
    return this.http.post<ApiResponse<SavedPassengerDTO>>(this.apiUrl, request)
      .pipe(map(res => res.data));
  }

  updateSavedPassenger(savedPassengerId: string, request: SavedPassengerRequest): Observable<SavedPassengerDTO> {
    return this.http.put<ApiResponse<SavedPassengerDTO>>(`${this.apiUrl}/${savedPassengerId}`, request)
      .pipe(map(res => res.data));
  }

  deactivateSavedPassenger(savedPassengerId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${savedPassengerId}`)
      .pipe(map(() => void 0));
  }
}
