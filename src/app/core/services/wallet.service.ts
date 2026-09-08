import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WalletDTO, WalletRechargeRequest, WalletTransactionDTO } from '../models/wallet';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = '/api/wallets';

  constructor(private http: HttpClient) {}

  getMyWallet(): Observable<WalletDTO> {
    return this.http.get<ApiResponse<WalletDTO>>(`${this.apiUrl}/my-wallet`).pipe(
      map(res => res.data!)
    );
  }

  rechargeWallet(request: WalletRechargeRequest): Observable<WalletDTO> {
    return this.http.post<ApiResponse<WalletDTO>>(`${this.apiUrl}/recharge`, request).pipe(
      map(res => res.data!)
    );
  }

  getMyTransactions(): Observable<WalletTransactionDTO[]> {
    return this.http.get<ApiResponse<WalletTransactionDTO[]>>(`${this.apiUrl}/transactions`).pipe(
      map(res => res.data || [])
    );
  }
}
