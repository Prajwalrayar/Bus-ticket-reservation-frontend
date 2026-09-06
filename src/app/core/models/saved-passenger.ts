export interface SavedPassengerDTO {
  savedPassengerId: string;
  passengerName: string;
  age: number;
  gender: string;
  idType?: string;
  idNumber?: string;
  contactNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedPassengerRequest {
  passengerName: string;
  age: number;
  gender: string;
  idType?: string;
  idNumber?: string;
  contactNumber?: string;
}
