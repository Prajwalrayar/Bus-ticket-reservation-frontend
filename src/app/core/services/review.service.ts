import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReviewDTO, ReviewCreateRequest } from '../models/review';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = '/api/reviews';

  constructor(private http: HttpClient) {}

  getMyReviews(): Observable<ReviewDTO[]> {
    return this.http.get<ApiResponse<ReviewDTO[]>>(`${this.apiUrl}/reviews/me`)
      .pipe(map(res => res.data));
  }

  getReviewByBooking(bookingId: string): Observable<ReviewDTO> {
    return this.http.get<ApiResponse<ReviewDTO>>(`${this.apiUrl}/${bookingId}/review`)
      .pipe(map(res => res.data));
  }

  createReview(bookingId: string, request: ReviewCreateRequest): Observable<ReviewDTO> {
    return this.http.post<ApiResponse<ReviewDTO>>(`${this.apiUrl}/${bookingId}/review`, request)
      .pipe(map(res => res.data));
  }

  updateReview(bookingId: string, request: ReviewCreateRequest): Observable<ReviewDTO> {
    return this.http.put<ApiResponse<ReviewDTO>>(`${this.apiUrl}/${bookingId}/review`, request)
      .pipe(map(res => res.data));
  }

  deleteReview(bookingId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${bookingId}/review`)
      .pipe(map(() => void 0));
  }
}
