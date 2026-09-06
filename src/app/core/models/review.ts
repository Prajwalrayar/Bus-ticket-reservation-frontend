export interface ReviewDTO {
  reviewId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  bookingId: string;
  userName: string;
}

export interface ReviewCreateRequest {
  rating: number;
  comment: string;
}
