import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmConfig {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private confirmState = new Subject<ConfirmConfig | null>();
  private result = new Subject<boolean>();

  public confirmState$ = this.confirmState.asObservable();

  constructor() {}

  confirm(message: string | ConfirmConfig): Observable<boolean> {
    const config = typeof message === 'string' ? { message } : message;
    this.confirmState.next(config);
    return this.result.asObservable();
  }

  respond(response: boolean) {
    this.result.next(response);
    this.confirmState.next(null);
  }
}
