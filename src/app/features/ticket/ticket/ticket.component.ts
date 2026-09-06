import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService } from '../../../core/services/ticket.service';
import { BookingService } from '../../../core/services/booking.service';
import { TicketDTO } from '../../../core/models/ticket';
import { BookingSeat } from '../../../core/models/booking-seat';

@Component({
  selector: 'app-ticket',
  standalone:false,
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.css',
})
export class TicketComponent implements OnInit {

  bookingReference: string = '';
  ticket: TicketDTO | null = null;
  qrCodeUrl: string = '';
  bookingSeats: BookingSeat[] = [];
  loading: boolean = true;
  errorMessage: string = '';
  showQrModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.bookingReference = params['bookingReference'];
      if (!this.bookingReference) {
        this.router.navigate(['/']);
        return;
      }
      this.fetchTicketAndBooking();
    });
  }

  fetchTicketAndBooking(): void {
    this.loading = true;
    this.bookingService.getBookingByReference(this.bookingReference).subscribe({
      next: (booking) => {
        this.bookingSeats = booking.bookingSeats;
        this.fetchTicket(booking.bookingId);
      },
      error: (err) => {
        this.errorMessage = 'Could not retrieve booking details.';
        this.loading = false;
      }
    });
  }

  fetchTicket(bookingId: string): void {
    this.ticketService.getTicketByBooking(bookingId).subscribe({
      next: (res) => {
        this.ticket = res.data;
        if (this.ticket.ticketNumber) {
          this.qrCodeUrl = this.ticketService.getTicketQrCodeUrl(this.ticket.ticketNumber);
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Could not retrieve ticket details.';
        this.loading = false;
      }
    });
  }

  printTicket(): void {
    window.print();
  }

  toggleQrCode(): void {
    this.showQrModal = !this.showQrModal;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}

