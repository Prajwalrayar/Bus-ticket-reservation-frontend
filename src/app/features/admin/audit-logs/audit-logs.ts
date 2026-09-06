import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuditLogDTO } from '../../../core/models/audit-log';

@Component({
  selector: 'app-audit-logs',
  standalone: false,
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css',
})
export class AuditLogs {
  activeTab: 'all' | 'action' | 'entity' = 'all';
  
  // Action Search
  searchAction = '';
  
  // Entity Search
  searchEntityName = '';
  searchEntityReference = '';

  auditLogs: AuditLogDTO[] = [];
  isLoading = false;
  hasSearched = false;
  errorMessage = '';

  constructor(
    private auditLogService: AuditLogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchAllLogs();
  }

  setTab(tab: 'all' | 'action' | 'entity'): void {
    this.activeTab = tab;
    this.resetSearch();
    if (tab === 'all') {
      this.fetchAllLogs();
    }
  }

  resetSearch(): void {
    this.auditLogs = [];
    this.hasSearched = false;
    this.errorMessage = '';
    this.searchAction = '';
    this.searchEntityName = '';
    this.searchEntityReference = '';
  }

  fetchAllLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.auditLogService.getAllAuditLogs().subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.hasSearched = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to fetch audit logs.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  searchByAction(): void {
    if (!this.searchAction.trim()) return;

    this.isLoading = true;
    this.errorMessage = '';
    
    this.auditLogService.getAuditLogsByAction(this.searchAction.trim()).subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.hasSearched = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to search audit logs by action.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  searchByEntity(): void {
    if (!this.searchEntityName.trim() || !this.searchEntityReference.trim()) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.auditLogService.getAuditLogsByEntity(this.searchEntityName.trim(), this.searchEntityReference.trim()).subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.hasSearched = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to search audit logs by entity.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
