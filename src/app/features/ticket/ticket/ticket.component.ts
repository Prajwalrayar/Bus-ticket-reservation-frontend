import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService } from '../../../core/services/ticket.service';
import { BookingService } from '../../../core/services/booking.service';
import { TicketDTO } from '../../../core/models/ticket';
import { BookingSeat } from '../../../core/models/booking-seat';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-ticket',
  standalone: false,
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
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef
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
    this.cdr.markForCheck();

    this.bookingService.getBookingByReference(this.bookingReference).subscribe({
      next: (booking) => {
        this.bookingSeats = booking.bookingSeats;
        this.fetchTicket(booking.bookingId);
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Could not retrieve booking details.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  fetchTicket(bookingId: string): void {
    this.ticketService.getTicketByBooking(bookingId).subscribe({
      next: (res) => {
        this.ticket = res.data;
        if (this.ticket?.ticketNumber) {
          this.qrCodeUrl = this.ticketService.getTicketQrCodeUrl(this.ticket.ticketNumber);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Could not retrieve ticket details.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Determine if a seat number is Upper berth (odd = lower, even = upper for sleeper) */
  getSeatType(seatNumber: string): string {
    const busType = this.ticket?.busType?.toUpperCase() || '';
    if (busType.includes('SLEEPER') || busType.includes('AC SLEEPER') || busType.includes('NON-AC SLEEPER')) {
      // Common convention: seats ending in U = Upper, L = Lower
      if (seatNumber.toUpperCase().endsWith('U')) return 'Upper';
      if (seatNumber.toUpperCase().endsWith('L')) return 'Lower';
      // Numeric: odd = lower, even = upper
      const num = parseInt(seatNumber.replace(/\D/g, ''), 10);
      if (!isNaN(num)) return num % 2 === 0 ? 'Upper' : 'Lower';
    }
    return 'Seat';
  }

  getSeatForPassenger(index: number): string {
    if (this.ticket?.seatNumbers && this.ticket.seatNumbers[index]) {
      return this.ticket.seatNumbers[index];
    }
    return '—';
  }

  downloadPdf(): void {
    const element = document.querySelector('.ticket-wrapper') as HTMLElement;
    if (!element) return;

    // Optional: add a class to adjust styles specifically for PDF capture if needed
    element.classList.add('pdf-capture');
    
    html2canvas(element, { 
      scale: 2, // Higher scale for better resolution
      useCORS: true, // Allow external images/fonts
      logging: false
    }).then(canvas => {
      element.classList.remove('pdf-capture');
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate image dimensions to fit A4 page
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 10, imgWidth, imgHeight);
      pdf.save(`BusTicket_${this.bookingReference}.pdf`);
    });
  }

  toggleQrCode(): void {
    this.showQrModal = !this.showQrModal;
    this.cdr.markForCheck();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
