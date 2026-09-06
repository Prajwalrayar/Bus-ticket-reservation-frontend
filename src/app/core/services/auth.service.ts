import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Login, LoginResponse } from '../models/login';
import { RegisterRequest } from '../models/register';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private apiUrl = '/api/auth';

  constructor(private http: HttpClient) {}

  login(loginData: Login): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, loginData)
      .pipe(map(res => res.data));
  }

  register(registerData: RegisterRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/register`, registerData)
      .pipe(map(res => res.data as void));
  }
}
