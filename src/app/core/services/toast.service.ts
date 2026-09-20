import { Injectable } from '@angular/core';

export interface Toast {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts: Toast[] = [];

  constructor() {}

  show(toast: Toast) {
    this.toasts.push(toast);
    setTimeout(() => this.remove(toast), 3000);
  }

  success(message: string) {
    this.show({ type: 'success', message });
  }

  error(message: string) {
    this.show({ type: 'error', message });
  }

  info(message: string) {
    this.show({ type: 'info', message });
  }

  warning(message: string) {
    this.show({ type: 'warning', message });
  }

  remove(toast: Toast) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }
}
