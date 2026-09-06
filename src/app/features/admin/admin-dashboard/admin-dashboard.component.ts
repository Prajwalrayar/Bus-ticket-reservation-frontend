import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboardDTO } from '../../../core/models/admin-dashboard';
import { AiService } from '../../../core/services/ai.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {

  dashboardData: AdminDashboardDTO | null = null;
  loading: boolean = true;
  error: string = '';

  aiSentimentData: any = null;
  aiAnalyticsLoading = false;
  aiAnalyticsError = '';

  constructor(
    private adminService: AdminService,
    private aiService: AiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchDashboardData();
    this.fetchAiAnalytics();
  }

  fetchDashboardData(): void {
    this.loading = true;
    this.error = '';
    this.adminService.getDashboardKPIs().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load admin dashboard data', err);
        this.error = 'Failed to load dashboard metrics. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  fetchAiAnalytics(): void {
    this.aiAnalyticsLoading = true;
    this.aiAnalyticsError = '';
    this.aiService.analyzeReviews().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.aiSentimentData = res.data;
        } else {
          this.aiAnalyticsError = 'Failed to load AI analytics.';
        }
        this.aiAnalyticsLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.aiAnalyticsError = err.error?.message || 'Error connecting to AI service.';
        this.aiAnalyticsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
