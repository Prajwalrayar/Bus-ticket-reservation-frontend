import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { BookingService } from '../../../core/services/booking.service';
import { SupportTicketService } from '../../../core/services/support-ticket.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { UserDTO } from '../../../core/models/user';
import { Booking } from '../../../core/models/booking';
import { SupportTicketDTO, SupportTicketStatus } from '../../../core/models/support-ticket';
import { CancellationService } from '../../../core/services/cancellation.service';
import { CancellationDTO } from '../../../core/models/cancellation';

@Component({
  selector: 'app-support-dashboard',
  standalone: false,
  templateUrl: './support-dashboard.html',
  styleUrl: './support-dashboard.css',
})
export class SupportDashboard implements OnInit, OnDestroy {
  activeTab: 'overview' | 'customer-issues' | 'tickets' | 'customer-bookings' | 'customers' | 'refunds' = 'overview';

  private routerSub?: Subscription;

  userProfile: UserDTO | null = null;

  customerBookings: Booking[] = [];
  customerBookingsError = '';
  customerBookingsLoading = false;

  bookingSearchTerm = '';
  bookingStatusFilter = '';
  bookingSortBy = 'dateDesc';

  get filteredAndSortedBookings(): Booking[] {
    let result = [...this.customerBookings];

    if (this.bookingStatusFilter) {
      result = result.filter(b => b.bookingStatus === this.bookingStatusFilter);
    }

    if (this.bookingSearchTerm) {
      const term = this.bookingSearchTerm.toLowerCase().trim();
      result = result.filter(b => 
        b.bookingReference.toLowerCase().includes(term) ||
        (b.userName && b.userName.toLowerCase().includes(term)) ||
        (b.userEmail && b.userEmail.toLowerCase().includes(term)) ||
        (b.boardingPointName && b.boardingPointName.toLowerCase().includes(term)) ||
        (b.droppingPointName && b.droppingPointName.toLowerCase().includes(term))
      );
    }

    result.sort((a, b) => {
      switch (this.bookingSortBy) {
        case 'dateDesc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'dateAsc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'status':
          return a.bookingStatus.localeCompare(b.bookingStatus);
        case 'customer':
          return (a.userName || '').localeCompare(b.userName || '');
        case 'seatsDesc':
          return b.totalSeats - a.totalSeats;
        case 'seatsAsc':
          return a.totalSeats - b.totalSeats;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }

  supportTickets: SupportTicketDTO[] = [];
  supportTicketsError = '';
  supportTicketsLoading = false;
  resolveError = '';

  pendingRefunds: CancellationDTO[] = [];
  refundsError = '';
  refundsLoading = false;
  processRefundError = '';

  get openIssues(): SupportTicketDTO[] {
    return this.supportTickets.filter(t =>
      t.status === SupportTicketStatus.OPEN || t.status === SupportTicketStatus.IN_PROGRESS
    );
  }

  get uniqueCustomers(): { userId: string; userName: string; userEmail: string; bookingCount: number }[] {
    const map = new Map<string, { count: number; name: string; email: string }>();
    this.customerBookings.forEach(b => {
      const existing = map.get(b.userId);
      if (existing) {
        existing.count++;
      } else {
        map.set(b.userId, { count: 1, name: b.userName || 'Unknown', email: b.userEmail || 'Unknown' });
      }
    });
    return Array.from(map.entries()).map(([userId, data]) => ({
      userId,
      userName: data.name,
      userEmail: data.email,
      bookingCount: data.count
    }));
  }

  constructor(
    private userService: UserService,
    private bookingService: BookingService,
    private supportTicketService: SupportTicketService,
    private cancellationService: CancellationService,
    private authState: AuthStateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.determineTabFromUrl();
    this.routerSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.determineTabFromUrl());
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
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
    } else if (url.includes('/support/refunds')) {
      this.setTab('refunds');
    } else {
      this.setTab('overview');
    }
  }

  setTab(tab: 'overview' | 'customer-issues' | 'tickets' | 'customer-bookings' | 'customers' | 'refunds'): void {
    this.activeTab = tab;
    
    // Load specific data for specific tabs
    if ((tab === 'customer-issues' || tab === 'tickets') && this.supportTickets.length === 0) {
      this.loadSupportTickets();
    }
    if ((tab === 'customer-bookings' || tab === 'customers') && this.customerBookings.length === 0) {
      this.loadCustomerBookings();
    }
    if (tab === 'refunds' && this.pendingRefunds.length === 0) {
      this.loadPendingRefunds();
    }
    
    // The overview tab needs ALL this data for its counters
    if (tab === 'overview') {
      if (this.supportTickets.length === 0) this.loadSupportTickets();
      if (this.customerBookings.length === 0) this.loadCustomerBookings();
    }
  }

  loadPendingRefunds(): void {
    this.refundsLoading = true;
    this.refundsError = '';
    this.cancellationService.getPendingRefunds().subscribe({
      next: (refunds) => {
        this.pendingRefunds = refunds;
        this.refundsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.refundsError = err.error?.message || 'Failed to load pending refunds';
        this.refundsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Booking Details Modal State ---
  selectedBookingDetails: Booking | null = null;
  selectedBookingCancellation: import('../../../core/models/cancellation').CancellationDTO | null = null;
  bookingDetailsLoading: boolean = false;
  bookingDetailsError: string = '';

  viewBookingDetails(bookingId: string): void {
    this.bookingDetailsError = '';
    // Find the booking from customerBookings array
    this.selectedBookingDetails = this.customerBookings.find(b => b.bookingId === bookingId) || null;
    this.selectedBookingCancellation = null;
    
    if (this.selectedBookingDetails) {
      if (this.selectedBookingDetails.bookingStatus === 'CANCELLED' || this.selectedBookingDetails.bookingStatus === 'FAILED') {
        this.bookingDetailsLoading = true;
        this.cancellationService.getCancellationByBooking(bookingId).subscribe({
          next: (cancellation) => {
            this.selectedBookingCancellation = cancellation;
            this.bookingDetailsLoading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error fetching cancellation details', err);
            this.bookingDetailsLoading = false;
            this.cdr.detectChanges();
          }
        });
      } else {
        this.cdr.detectChanges();
      }
    }
  }

  viewBookingDetailsByRef(bookingRef: string): void {
    if (!this.customerBookings || this.customerBookings.length === 0) {
      // If customer bookings aren't loaded yet, try loading them first
      this.customerBookingsLoading = true;
      this.bookingService.getAllBookings().subscribe({
        next: (bookings) => {
          this.customerBookings = bookings;
          this.customerBookingsLoading = false;
          const booking = this.customerBookings.find(b => b.bookingReference === bookingRef);
          if (booking) {
            this.viewBookingDetails(booking.bookingId);
          } else {
            this.bookingDetailsError = 'Booking details not found for reference: ' + bookingRef;
            this.selectedBookingDetails = null;
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.customerBookingsLoading = false;
          this.bookingDetailsError = 'Failed to load bookings to find reference: ' + bookingRef;
          this.cdr.detectChanges();
        }
      });
    } else {
      const booking = this.customerBookings.find(b => b.bookingReference === bookingRef);
      if (booking) {
        this.viewBookingDetails(booking.bookingId);
      } else {
        this.bookingDetailsError = 'Booking details not found for reference: ' + bookingRef;
        this.selectedBookingDetails = null;
        this.cdr.detectChanges();
      }
    }
  }

  closeBookingDetails(): void {
    this.selectedBookingDetails = null;
    this.selectedBookingCancellation = null;
    this.cdr.detectChanges();
  }

  // Modal State
  showRefundModal = false;
  selectedCancellationIdForRefund = '';
  processRefundModalLoading = false;

  openRefundModal(cancellationId: string): void {
    this.selectedCancellationIdForRefund = cancellationId;
    this.processRefundError = '';
    this.showRefundModal = true;
  }

  closeRefundModal(): void {
    this.showRefundModal = false;
    this.selectedCancellationIdForRefund = '';
  }

  confirmRefund(): void {
    this.processRefundModalLoading = true;
    this.processRefundError = '';
    
    this.cancellationService.processRefund(this.selectedCancellationIdForRefund).subscribe({
      next: () => {
        this.processRefundModalLoading = false;
        this.closeRefundModal();
        this.loadPendingRefunds();
      },
      error: (err) => {
        this.processRefundError = err.error?.message || 'Failed to process refund';
        this.processRefundModalLoading = false;
        this.cdr.detectChanges();
      }
    });
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

  promptResolveTicket(ticketId: string): void {
    this.resolveTicketId = ticketId;
    this.showResolveConfirm = true;
  }

  cancelResolve(): void {
    this.showResolveConfirm = false;
    this.resolveTicketId = null;
  }

  confirmResolveTicket(): void {
    if (!this.resolveTicketId) return;
    const ticketId = this.resolveTicketId;
    this.showResolveConfirm = false;
    this.resolveTicketId = null;
    this.resolveError = '';
    this.supportTicketService.resolveTicket(ticketId).subscribe({
      next: () => { 
        this.loadSupportTickets();
        if (this.selectedTicket && this.selectedTicket.ticketId === ticketId) {
          this.viewTicket(ticketId); // Refresh selected ticket
        }
      },
      error: (err: any) => {
        this.resolveError = err.error?.message || 'Failed to resolve ticket';
        this.cdr.detectChanges();
      }
    });
  }

  resolveTicket(ticketId: string): void {
    this.resolveError = '';
    this.supportTicketService.resolveTicket(ticketId).subscribe({
      next: () => { 
        this.loadSupportTickets();
        if (this.selectedTicket && this.selectedTicket.ticketId === ticketId) {
          this.viewTicket(ticketId); // Refresh selected ticket
        }
      },
      error: (err: any) => {
        this.resolveError = err.error?.message || 'Failed to resolve ticket';
        this.cdr.detectChanges();
      }
    });
  }

  // --- Ticket Details & Reply State ---
  selectedTicket: import('../../../core/models/support-ticket').SupportTicketWithMessagesDTO | null = null;
  selectedTicketLoading = false;
  selectedTicketError = '';
  newReplyMessage = '';
  newReplyInternal = false;
  replyLoading = false;
  showResolveConfirm = false;
  resolveTicketId: string | null = null;

  viewTicket(ticketId: string): void {
    this.selectedTicketLoading = true;
    this.selectedTicketError = '';
    this.selectedTicket = null;
    this.supportTicketService.getTicketWithMessages(ticketId).subscribe({
      next: (ticket) => {
        this.selectedTicket = ticket;
        this.selectedTicketLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.selectedTicketError = err.error?.message || 'Failed to load ticket details';
        this.selectedTicketLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeTicketView(): void {
    this.selectedTicket = null;
    this.selectedTicketError = '';
    this.selectedTicketLoading = false;
    this.newReplyMessage = '';
    this.newReplyInternal = false;
    this.cdr.detectChanges();
  }

  insertQuickReply(type: 'cancellation' | 'apology' | 'resolved'): void {
    let reply = '';
    switch(type) {
      case 'cancellation':
        reply = 'To view our detailed Cancellation and Refund Policies, as well as Baggage and Pets constraints, please navigate to your Profile and click on the "Help & Policies" tab from the main menu.';
        break;
      case 'apology':
        reply = 'We sincerely apologize for the inconvenience caused. We are actively looking into this issue and will update you shortly.';
        break;
      case 'resolved':
        reply = 'We are pleased to inform you that this issue has been resolved. If you have any further questions, feel free to reopen this ticket or create a new one.';
        break;
    }
    this.newReplyMessage = this.newReplyMessage ? this.newReplyMessage + '\n\n' + reply : reply;
    this.cdr.detectChanges();
  }

  sendReply(): void {
    if (!this.selectedTicket || !this.newReplyMessage.trim()) return;
    this.replyLoading = true;
    
    const request: import('../../../core/models/support-ticket').SupportTicketReplyRequest = {
      message: this.newReplyMessage,
      isInternal: this.newReplyInternal
    };

    this.supportTicketService.addMessage(this.selectedTicket.ticketId, request).subscribe({
      next: (msg) => {
        this.replyLoading = false;
        this.newReplyMessage = '';
        this.newReplyInternal = false;
        this.viewTicket(this.selectedTicket!.ticketId); // Refresh thread
        this.loadSupportTickets(); // Refresh list to get updated status
      },
      error: (err: any) => {
        this.selectedTicketError = err.error?.message || 'Failed to send reply';
        this.replyLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'OPEN': return 'bg-danger';
      case 'ASSIGNED': return 'bg-primary text-white';
      case 'IN_PROGRESS': return 'bg-warning text-dark';
      case 'WAITING_FOR_PASSENGER': return 'bg-info text-dark';
      case 'PASSENGER_REPLIED': return 'bg-danger';
      case 'RESOLVED': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'HIGH': return 'badge bg-danger bg-opacity-10 text-danger border border-danger';
      case 'MEDIUM': return 'badge bg-warning bg-opacity-10 text-warning border border-warning';
      case 'LOW': return 'badge bg-info bg-opacity-10 text-info border border-info';
      default: return 'badge bg-secondary';
    }
  }
}
