import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UserService } from '../../../core/services/user.service';
import { BookingService } from '../../../core/services/booking.service';
import { SupportTicketService } from '../../../core/services/support-ticket.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { UserDTO } from '../../../core/models/user';
import { Booking } from '../../../core/models/booking';
import { SupportTicketDTO, SupportTicketStatus } from '../../../core/models/support-ticket';

@Component({
  selector: 'app-support-dashboard',
  standalone: false,
  templateUrl: './support-dashboard.html',
  styleUrl: './support-dashboard.css',
})
export class SupportDashboard implements OnInit {
  activeTab: 'overview' | 'customer-issues' | 'tickets' | 'customer-bookings' | 'customers' = 'overview';

  userProfile: UserDTO | null = null;

  customerBookings: Booking[] = [];
  customerBookingsError = '';
  customerBookingsLoading = false;

  supportTickets: SupportTicketDTO[] = [];
  supportTicketsError = '';
  supportTicketsLoading = false;
  resolveError = '';

  get openIssues(): SupportTicketDTO[] {
    return this.supportTickets.filter(t =>
      t.status === SupportTicketStatus.OPEN || t.status === SupportTicketStatus.IN_PROGRESS
    );
  }

  get uniqueCustomers(): { userId: string; bookingCount: number }[] {
    const map = new Map<string, number>();
    this.customerBookings.forEach(b => map.set(b.userId, (map.get(b.userId) || 0) + 1));
    return Array.from(map.entries()).map(([userId, bookingCount]) => ({ userId, bookingCount }));
  }

  constructor(
    private userService: UserService,
    private bookingService: BookingService,
    private supportTicketService: SupportTicketService,
    private authState: AuthStateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.determineTabFromUrl();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.determineTabFromUrl());
  }

  determineTabFromUrl(): void {
    const url = this.router.url;
    if (url.includes('/support/customer-issues')) {
      this.setTab('customer-issues');
    } else if (url.includes('/support/tickets')) {
      this.setTab('tickets');
    } else if (url.includes('/support/bookings')) {
      this.setTab('customer-bookings');
    } else if (url.includes('/support/customers')) {
      this.setTab('customers');
    } else {
      this.setTab('overview');
    }
  }

  setTab(tab: 'overview' | 'customer-issues' | 'tickets' | 'customer-bookings' | 'customers'): void {
    this.activeTab = tab;
    if ((tab === 'customer-issues' || tab === 'tickets') && this.supportTickets.length === 0) {
      this.loadSupportTickets();
    }
    if ((tab === 'customer-bookings' || tab === 'customers') && this.customerBookings.length === 0) {
      this.loadCustomerBookings();
    }
  }

  loadProfile(): void {
    this.userService.getMyProfile().subscribe({
      next: (profile: UserDTO) => { 
        this.userProfile = profile; 
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading profile', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadCustomerBookings(): void {
    this.customerBookingsLoading = true;
    this.customerBookingsError = '';
    this.bookingService.getAllBookings().subscribe({
      next: (bookings: Booking[]) => {
        this.customerBookings = bookings;
        this.customerBookingsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.customerBookingsError = err.error?.message || 'Failed to load customer bookings';
        this.customerBookingsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadSupportTickets(): void {
    this.supportTicketsLoading = true;
    this.supportTicketsError = '';
    this.supportTicketService.getTicketsByOperator().subscribe({
      next: (tickets: SupportTicketDTO[]) => {
        this.supportTickets = tickets;
        this.supportTicketsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.supportTicketsError = err.error?.message || 'Failed to load support tickets';
        this.supportTicketsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  resolveTicket(ticketId: string): void {
    if (!confirm('Mark this ticket as resolved?')) return;
    this.resolveError = '';
    this.supportTicketService.updateTicketStatus(ticketId, { status: SupportTicketStatus.RESOLVED }).subscribe({
      next: () => { 
        this.loadSupportTickets(); 
      },
      error: (err: any) => {
        this.resolveError = err.error?.message || 'Failed to resolve ticket';
        this.cdr.detectChanges();
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'OPEN': return 'bg-danger';
      case 'PENDING': return 'bg-warning text-dark';
      case 'RESOLVED': return 'bg-success';
      case 'CLOSED': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }
}
