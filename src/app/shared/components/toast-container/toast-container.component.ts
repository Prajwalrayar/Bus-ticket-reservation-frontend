import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1055;">
      <div *ngFor="let toast of toastService.toasts" class="toast show align-items-center text-white border-0" 
           [ngClass]="{
             'bg-success': toast.type === 'success',
             'bg-danger': toast.type === 'error',
             'bg-info': toast.type === 'info',
             'bg-warning': toast.type === 'warning'
           }"
           role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi me-2" [ngClass]="{
              'bi-check-circle': toast.type === 'success',
              'bi-exclamation-triangle': toast.type === 'error' || toast.type === 'warning',
              'bi-info-circle': toast.type === 'info'
            }"></i>
            {{ toast.message }}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close" (click)="toastService.remove(toast)"></button>
        </div>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
}
