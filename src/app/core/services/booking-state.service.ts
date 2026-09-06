import { Injectable, signal } from '@angular/core';
import { Passenger } from '../models/passenger';

@Injectable({
  providedIn: 'root',
})
export class BookingStateService {
  // ==========================================================
  // STATE SIGNALS
  // ==========================================================
  private passengers = signal<Passenger[]>([]);
  private totalAmount = signal<number>(0);

  // ==========================================================
  // PASSENGER METHODS
  // ==========================================================
  setPassengers(passengers: Passenger[]): void {
    this.passengers.set([...passengers]);
  }

  getPassengers(): Passenger[] {
    return this.passengers();
  }

  clearPassengers(): void {
    this.passengers.set([]);
  }

  // ==========================================================
  // TOTAL AMOUNT METHODS
  // ==========================================================
  setTotalAmount(amount: number): void {
    this.totalAmount.set(amount);
  }

  getTotalAmount(): number {
    return this.totalAmount();
  }

  // ==========================================================
  // CLEAR ALL BOOKING DATA
  // ==========================================================
  clearAllBookingData(): void {
    this.passengers.set([]);
    this.totalAmount.set(0);
  }

}
