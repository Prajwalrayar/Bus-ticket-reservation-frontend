export interface TicketDTO {
  ticketId: string;
  ticketNumber: string;
  verificationCode: string;
  bookingId: string;
  operatorName: string;
  busNumber: string;
  busType: string;
  source: string;
  destination: string;
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  issuedAt: string;
  boardingPoint: string;
  boardingTime: string;
  droppingPoint: string;
  seatNumbers: string[];
  totalSeats: number;
  totalAmount: number;
  isValidated: boolean;
  validatedAt: string;
}
