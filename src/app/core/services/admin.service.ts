import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AdminDashboardDTO } from '../models/admin-dashboard';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  getDashboardKPIs(): Observable<AdminDashboardDTO> {
    return this.http.get<ApiResponse<AdminDashboardDTO>>(`${this.apiUrl}/dashboard`)
      .pipe(map(res => res.data));
  }

  createStaff(request: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/staff`, request)
      .pipe(map(res => res.data));
  }
}
