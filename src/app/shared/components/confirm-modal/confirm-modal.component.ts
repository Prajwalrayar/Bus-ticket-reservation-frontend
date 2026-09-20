import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmConfig } from '../../../core/services/confirm.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal fade show d-block" tabindex="-1" role="dialog" *ngIf="config" style="background: rgba(0,0,0,0.5); z-index: 1060;">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-primary text-white border-0">
            <h5 class="modal-title fw-bold"><i class="bi bi-question-circle me-2"></i> {{ config.title || 'Confirm Action' }}</h5>
            <button type="button" class="btn-close btn-close-white" aria-label="Close" (click)="onCancel()"></button>
          </div>
          <div class="modal-body p-4">
            <p class="mb-0 fs-5 text-center">{{ config.message }}</p>
          </div>
          <div class="modal-footer border-0 d-flex justify-content-center bg-light">
            <button type="button" class="btn btn-outline-secondary px-4" (click)="onCancel()">{{ config.cancelText || 'Cancel' }}</button>
            <button type="button" class="btn btn-primary px-4" (click)="onConfirm()">{{ config.confirmText || 'Confirm' }}</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConfirmModalComponent implements OnInit, OnDestroy {
  config: ConfirmConfig | null = null;
  private sub?: Subscription;

  constructor(private confirmService: ConfirmService) {}

  ngOnInit() {
    this.sub = this.confirmService.confirmState$.subscribe(config => {
      this.config = config;
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  onConfirm() {
    this.confirmService.respond(true);
  }

  onCancel() {
    this.confirmService.respond(false);
  }
}
