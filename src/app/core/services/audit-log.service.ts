import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuditLogDTO } from '../models/audit-log';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private readonly apiUrl = '/api/audit-logs';

  constructor(private http: HttpClient) {}

  getAuditLogsByEntity(entityName: string, entityReference: string): Observable<AuditLogDTO[]> {
    const params = new HttpParams()
      .set('entityName', entityName)
      .set('entityReference', entityReference);

    return this.http.get<ApiResponse<AuditLogDTO[]>>(`${this.apiUrl}/entity`, { params })
      .pipe(map(response => response.data));
  }

  getAuditLogsByAction(action: string): Observable<AuditLogDTO[]> {
    return this.http.get<ApiResponse<AuditLogDTO[]>>(`${this.apiUrl}/action/${action}`)
      .pipe(map(response => response.data));
  }

  getAllAuditLogs(): Observable<AuditLogDTO[]> {
    return this.http.get<ApiResponse<AuditLogDTO[]>>(this.apiUrl)
      .pipe(map(response => response.data));
  }
}
