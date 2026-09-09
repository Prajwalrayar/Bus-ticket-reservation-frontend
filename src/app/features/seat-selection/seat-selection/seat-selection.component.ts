import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TripDTO } from '../../../core/models/trip';
import { TripSeatDTO } from '../../../core/models/seat';
import { TripService } from '../../../core/services/trip.service';
import { SeatService } from '../../../core/services/seat.service';

export interface SeatRow {
  rowId: string;
  leftSeats: TripSeatDTO[];
  rightSeats: TripSeatDTO[];
}

export interface DeckLayout {
  deckName: string;
  rows: SeatRow[];
}

@Component({
  selector: 'app-seat-selection',
  standalone: false,
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.css',
})
export class SeatSelectionComponent implements OnInit {
  bus = signal<TripDTO | null>(null);
  seats = signal<TripSeatDTO[]>([]);
  lowerDeckLayout = signal<DeckLayout | null>(null);
  upperDeckLayout = signal<DeckLayout | null>(null);
  selectedSeats = signal<TripSeatDTO[]>([]);
  noSeatsFound = signal(false);

  loading = signal(false);
  errorMessage = signal('');
  fromCity = signal('');
  toCity = signal('');
  journeyDate = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripService: TripService,
    private seatService: SeatService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const tripId = params['tripId'];

      this.fromCity.set(params['from'] || '');
      this.toCity.set(params['to'] || '');
      this.journeyDate.set(params['date'] || '');

      if (!tripId) {
        this.errorMessage.set('Bus information is missing.');
        return;
      }

      this.loadBus(tripId);
      // loadSeats is now called after bus is loaded to avoid race condition
    });
  }

  loadBus(tripId: string): void {
    this.loading.set(true);
    this.tripService.getTripById(tripId).subscribe({
      next: (response) => {
        if (response.data) {
          this.bus.set(response.data);
          this.loadSeats(tripId);
        } else {
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('Unable to load bus:', error);
        this.loading.set(false);
        this.errorMessage.set('Unable to load bus details.');
      }
    });
  }

  loadSeats(tripId: string): void {
    this.seatService.getTripSeats(tripId).subscribe({
      next: (response) => {
        let loadedSeats = response.data || [];
        
        // Use fare query parameter if available (from dynamic fare calculation in search page)
        const fareParam = this.route.snapshot.queryParamMap.get('fare');
        if (fareParam) {
          const dynamicFare = Number(fareParam);
          if (dynamicFare > 0) {
            loadedSeats = loadedSeats.map(seat => ({
              ...seat,
              seatFare: dynamicFare
            }));
          }
        } else if (this.bus() && this.bus()!.segments && this.bus()!.segments!.length > 0) {
          // Fallback to recalculating from segments
          const fromCity = this.fromCity().toLowerCase();
          const toCity = this.toCity().toLowerCase();
          
          let segmentFare = 0;
          for (const seg of this.bus()!.segments!) {
            if (seg.boardingStopName.toLowerCase() === fromCity && seg.droppingStopName.toLowerCase() === toCity) {
              segmentFare = seg.fare;
              break;
            }
          }
          
          if (segmentFare > 0) {
            loadedSeats = loadedSeats.map(seat => ({
              ...seat,
              seatFare: segmentFare
            }));
          }
        }

        this.seats.set(loadedSeats);
        
        if (this.bus()) {
          this.processSeatLayout(loadedSeats, this.bus()!.busType);
        }
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Unable to load seats:', error);
        this.errorMessage.set('Unable to load seats.');
      }
    });
  }

  processSeatLayout(seats: TripSeatDTO[], busType: string): void {
    if (seats.length === 0) {
      this.noSeatsFound.set(true);
      this.lowerDeckLayout.set(null);
      this.upperDeckLayout.set(null);
      return;
    }

    this.noSeatsFound.set(false);
    const upperSeats = seats.filter(s => String(s.seatPosition).toUpperCase() === 'UPPER');
    const lowerSeats = seats.filter(s => String(s.seatPosition).toUpperCase() !== 'UPPER');

    if (lowerSeats.length > 0) {
      this.lowerDeckLayout.set(this.buildDeckLayout('Lower Deck', lowerSeats, busType));
    } else {
      this.lowerDeckLayout.set(null);
    }
    
    if (upperSeats.length > 0) {
      this.upperDeckLayout.set(this.buildDeckLayout('Upper Deck', upperSeats, busType));
    } else {
      this.upperDeckLayout.set(null);
    }
  }

  buildDeckLayout(deckName: string, seats: TripSeatDTO[], busType: string): DeckLayout {
    const sortedSeats = [...seats].sort((a, b) => {
      return a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true, sensitivity: 'base' });
    });

    const isSleeper = busType.toUpperCase().includes('SLEEPER') || deckName.includes('Upper');
    const seatsPerRow = isSleeper ? 3 : 4;
    const leftSize = isSleeper ? 1 : 2;

    const rows: SeatRow[] = [];
    let currentRowSeats: TripSeatDTO[] = [];
    let rowNum = 1;

    for (let i = 0; i < sortedSeats.length; i++) {
      currentRowSeats.push(sortedSeats[i]);
      if (currentRowSeats.length === seatsPerRow || i === sortedSeats.length - 1) {
        rows.push({
          rowId: `Row-${rowNum}`,
          leftSeats: currentRowSeats.slice(0, leftSize),
          rightSeats: currentRowSeats.slice(leftSize)
        });
        currentRowSeats = [];
        rowNum++;
      }
    }

    return { deckName, rows };
  }

  selectSeat(seat: TripSeatDTO): void {
    if (seat.seatStatus === 'TEMPORARILY_LOCKED' || seat.seatStatus === 'BOOKED') {
      return;
    }

    const alreadySelected = this.selectedSeats().some(s => s.tripSeatId === seat.tripSeatId);

    if (alreadySelected) {
      this.selectedSeats.update(seats => seats.filter(s => s.tripSeatId !== seat.tripSeatId));
      return;
    }

    this.selectedSeats.update(seats => [...seats, seat]);
  }

  isSelected(seat: TripSeatDTO): boolean {
    return this.selectedSeats().some(s => s.tripSeatId === seat.tripSeatId);
  }

  getTotalAmount(): number {
    return this.selectedSeats().reduce((total, seat) => total + (seat.seatFare || 0), 0);
  }

  goBack(): void {
    this.router.navigate(['/search'], {
      queryParams: {
        from: this.fromCity(),
        to: this.toCity(),
        date: this.journeyDate()
      }
    });
  }

  continueBooking(): void {
    if (this.selectedSeats().length === 0) {
      this.errorMessage.set('Please select at least one seat.');
      return;
    }

    const currentBus = this.bus();
    if (!currentBus) {
      this.errorMessage.set('Bus information is missing.');
      return;
    }

    // Directly navigate to passenger details, deferring the lock until the actual booking creation
    this.router.navigate(['/passenger-details'], {
      queryParams: {
        tripId: currentBus.tripId,
        busName: currentBus.operatorName,
        from: this.fromCity() || currentBus.source,
        to: this.toCity() || currentBus.destination,
        date: this.journeyDate(),
        seats: this.selectedSeats().map(s => s.seatNumber).join(',')
      }
    });
  }
}
