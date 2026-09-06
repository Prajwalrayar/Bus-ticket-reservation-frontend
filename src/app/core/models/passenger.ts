export interface Passenger {
  passengerName: string;
  age: number | null;
  gender: string;
  idType: string;
  idNumber: string;
  contactNumber: string;
  seatNumber: string;
  isPrimary?: boolean;
}