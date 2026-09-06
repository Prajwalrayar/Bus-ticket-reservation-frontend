import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OperatorDTO } from '../models/operator';
import { ApiResponse } from '../models/api-response';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OperatorService {
  private apiUrl = '/api/operators';

  constructor(private http: HttpClient) {}

  getAllOperators(): Observable<OperatorDTO[]> {
    return this.http.get<ApiResponse<OperatorDTO[]>>(`${this.apiUrl}`).pipe(
      map(res => res.data)
    );
  }

  getOperatorByCompanyName(companyName: string): Observable<OperatorDTO> {
    return this.http.get<ApiResponse<OperatorDTO>>(`${this.apiUrl}/${companyName}`).pipe(
      map(res => res.data)
    );
  }

  createOperator(operator: any): Observable<OperatorDTO> {
    return this.http.post<ApiResponse<OperatorDTO>>(`${this.apiUrl}`, operator).pipe(
      map(res => res.data)
    );
  }

  updateOperator(companyName: string, operator: OperatorDTO): Observable<OperatorDTO> {
    return this.http.put<ApiResponse<OperatorDTO>>(`${this.apiUrl}/${companyName}`, operator).pipe(
      map(res => res.data)
    );
  }

  approveOperator(companyName: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${companyName}/approve`, {}).pipe(
      map(res => res.data)
    );
  }
}
