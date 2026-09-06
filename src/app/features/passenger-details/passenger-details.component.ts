import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Passenger } from '../../core/models/passenger';
import { BookingStateService } from '../../core/services/booking-state.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { TripService } from '../../core/services/trip.service';
import { SavedPassengerService } from '../../core/services/saved-passenger.service';
import { RouteStopDTO } from '../../core/models/trip';
import { SavedPassengerDTO } from '../../core/models/saved-passenger';

@Component({
  selector: 'app-passenger-details',
  standalone: false,
  templateUrl: './passenger-details.component.html',
  styleUrl: './passenger-details.component.css',
})
export class PassengerDetailsComponent implements OnInit {

  fromCity = signal('');
  toCity = signal('');
  journeyDate = signal('');
  tripId = signal('');
  busName = signal('');
  
  selectedSeatNumbers = signal<string[]>([]);
  passengers = signal<Passenger[]>([]);
  
  boardingPoints = signal<RouteStopDTO[]>([]);
  droppingPoints = signal<RouteStopDTO[]>([]);
  selectedBoardingPoint = signal<string>('');
  selectedDroppingPoint = signal<string>('');

  errorMessage = signal('');
  loading = signal(false);

  mySavedPassengers = signal<SavedPassengerDTO[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router, 
    private bookingStateService: BookingStateService,
    private authStateService: AuthStateService,
    private tripService: TripService,
    private savedPassengerService: SavedPassengerService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const tripId = params['tripId'] || '';
      const seatsParam = params['seats'] || '';

      this.tripId.set(tripId);
      this.fromCity.set(params['from'] || '');
      this.toCity.set(params['to'] || '');
      this.journeyDate.set(params['date'] || '');
      this.busName.set(params['busName'] || '');

      if (!tripId) {
        this.errorMessage.set('Bus information is missing.');
        return;
      }

      const seatNumbers = seatsParam.split(',').filter((seat: string) => seat.trim() !== '');
      if (seatNumbers.length === 0) {
        this.errorMessage.set('No seats have been selected.');
        return;
      }

      this.selectedSeatNumbers.set(seatNumbers);
      
      this.loadRouteStops();
      this.loadMySavedPassengers();

      const savedPassengers = this.bookingStateService.getPassengers();
      const currentUser = this.authStateService.getUser();

      const passengerList: Passenger[] = seatNumbers.map((seatNumber: string, index: number) => {
        const savedPassenger = savedPassengers.find(p => p.seatNumber === seatNumber);
        if (savedPassenger) {
          return savedPassenger;
        }

        return {
          seatNumber: seatNumber,
          passengerName: index === 0 ? (currentUser?.name || '') : '',
          age: null,
          gender: '',
          idType: '',
          idNumber: '',
          contactNumber: index === 0 ? (currentUser?.phone || '') : '',
          isPrimary: index === 0
        };
      });

      this.passengers.set(passengerList);
    });
  }

  loadMySavedPassengers(): void {
    this.savedPassengerService.getMySavedPassengers().subscribe({
      next: (passengers) => {
        this.mySavedPassengers.set(passengers.filter(p => p.isActive));
      },
      error: (err) => {
        console.error('Failed to load saved passengers', err);
      }
    });
  }

  applySavedPassenger(index: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const passengerId = select.value;
    
    if (!passengerId) return;

    const savedPass = this.mySavedPassengers().find(p => p.savedPassengerId === passengerId);
    if (savedPass) {
      this.passengers.update(passengers => {
        const updated = [...passengers];
        updated[index] = {
          ...updated[index],
          passengerName: savedPass.passengerName,
          age: savedPass.age,
          gender: savedPass.gender,
          idType: savedPass.idType || '',
          idNumber: savedPass.idNumber || '',
          contactNumber: savedPass.contactNumber || updated[index].contactNumber // keep primary contact if empty
        };
        return updated;
      });
    }
  }

  loadRouteStops(): void {
    const from = this.fromCity();
    const to = this.toCity();
    if (!from || !to) return;

    this.loading.set(true);
    this.tripService.getRouteStops(from, to).subscribe({
      next: (response) => {
        const stops = response.data || [];
        this.boardingPoints.set(stops.filter(s => s.stopType === 'BOARDING' || s.stopType === 'BOTH'));
        this.droppingPoints.set(stops.filter(s => s.stopType === 'DROPPING' || s.stopType === 'BOTH'));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load route stops:', err);
        this.errorMessage.set('Could not load boarding and dropping points.');
        this.loading.set(false);
      }
    });
  }

  updatePassenger(index: number, field: keyof Passenger, value: string | number | null): void {
    this.passengers.update(passengers => {
      const updatedPassengers = [...passengers];
      updatedPassengers[index] = {
        ...updatedPassengers[index],
        [field]: value
      };
      return updatedPassengers;
    });
  }

  validatePassengers(): boolean {
    if (!this.selectedBoardingPoint()) {
      this.errorMessage.set('Please select a boarding point.');
      return false;
    }

    if (!this.selectedDroppingPoint()) {
      this.errorMessage.set('Please select a dropping point.');
      return false;
    }

    for (const passenger of this.passengers()) {
      if (!passenger.passengerName || !passenger.passengerName.trim()) {
        this.errorMessage.set(`Please enter name for seat ${passenger.seatNumber}.`);
        return false;
      }

      if (passenger.age === null || passenger.age < 1 || passenger.age > 120) {
        this.errorMessage.set(`Please enter a valid age for seat ${passenger.seatNumber}.`);
        return false;
      }

      if (!passenger.gender || !['MALE', 'FEMALE', 'OTHER'].includes(passenger.gender)) {
        this.errorMessage.set(`Please select gender for seat ${passenger.seatNumber}.`);
        return false;
      }

      if (passenger.isPrimary) {
        if (!passenger.contactNumber || !passenger.contactNumber.trim() || !/^[6-9]\d{9}$/.test(passenger.contactNumber)) {
          this.errorMessage.set(`Please enter a valid phone number for the primary passenger.`);
          return false;
        }
      }
    }

    return true;
  }

  continueBooking(): void {
    this.errorMessage.set('');

    if (!this.validatePassengers()) {
      return;
    }

    // Save passengers globally just in case
    this.bookingStateService.setPassengers(this.passengers());

    // NOTE: In Phase 11, the instruction is: Submit button "Proceed to Payment" (or "Review Booking").
    // We navigate to /booking-confirmation, passing the boarding and dropping points too.
    this.router.navigate(['/booking-confirmation'], {
      queryParams: {
        tripId: this.tripId(),
        from: this.fromCity(),
        to: this.toCity(),
        date: this.journeyDate(),
        seats: this.selectedSeatNumbers().join(','),
        boardingPointId: this.selectedBoardingPoint(),
        droppingPointId: this.selectedDroppingPoint()
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/seat-selection'], {
      queryParams: {
        tripId: this.tripId(),
        from: this.fromCity(),
        to: this.toCity(),
        date: this.journeyDate(),
        seats: this.selectedSeatNumbers().join(',')
      }
    });
  }
}
