import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { UserDTO, UserUpdateRequest, ChangePasswordRequest } from '../models/user';
import { ApiResponse } from '../models/api-response';
import { AuthStateService } from './auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient, private authStateService: AuthStateService) {}

  getMyProfile(): Observable<UserDTO> {
    return this.http.get<ApiResponse<UserDTO>>(`${this.apiUrl}/me`)
      .pipe(map(res => res.data));
  }

  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<ApiResponse<UserDTO[]>>(this.apiUrl)
      .pipe(map(res => res.data));
  }

  updateMyProfile(request: UserUpdateRequest): Observable<UserDTO> {
    return this.http.put<ApiResponse<UserDTO>>(`${this.apiUrl}/me`, request)
      .pipe(
        map(res => res.data),
        tap(updatedUser => {
          // Keep the global auth state synchronized
          const current = this.authStateService.getUser();
          if (current) {
            this.authStateService.setUser({
              ...current,
              name: updatedUser.userName
            });
          }
        })
      );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/me/password`, request)
      .pipe(map(() => void 0));
  }
}
