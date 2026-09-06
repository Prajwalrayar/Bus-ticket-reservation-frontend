import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import {
  ChatRequest, ChatResponse, RecommendationResponse,
  TravelOptionResponse, DemandPredictionResponse, DynamicPricingResponse,
  PersonalizedOfferResponse, SentimentAnalysisResult, DelayPredictionResponse
} from '../models/ai.model';
import { TripDTO } from '../models/trip';

@Injectable({
  providedIn: 'root'
})
export class AiService {

  private apiUrl = `/api/ai`;

  constructor(private http: HttpClient) { }

  // Phase 1: Natural Language Search
  searchBusesByNaturalLanguage(query: string): Observable<ApiResponse<TripDTO[]>> {
    return this.http.post<ApiResponse<TripDTO[]>>(`${this.apiUrl}/search`, { query });
  }

  // Phase 2: Smart Recommendation
  getSmartRecommendations(userId: string): Observable<ApiResponse<RecommendationResponse[]>> {
    return this.http.get<ApiResponse<RecommendationResponse[]>>(`${this.apiUrl}/recommendations/${userId}`);
  }

  // Phase 3: Route & Travel Recommendation
  getTravelRecommendations(source: string, destination: string, travelDate: string): Observable<ApiResponse<TravelOptionResponse[]>> {
    return this.http.get<ApiResponse<TravelOptionResponse[]>>(`${this.apiUrl}/travel-options`, {
      params: { source, destination, travelDate }
    });
  }

  // Phase 4: Demand Prediction
  getDemandPrediction(tripId: string): Observable<ApiResponse<DemandPredictionResponse>> {
    return this.http.get<ApiResponse<DemandPredictionResponse>>(`${this.apiUrl}/demand/${tripId}`);
  }

  // Phase 5: Dynamic Pricing
  getDynamicPricing(tripId: string): Observable<ApiResponse<DynamicPricingResponse>> {
    return this.http.get<ApiResponse<DynamicPricingResponse>>(`${this.apiUrl}/price/${tripId}`);
  }

  // Phase 6: Personalized Offers
  getPersonalizedOffers(userId: string): Observable<ApiResponse<PersonalizedOfferResponse[]>> {
    return this.http.get<ApiResponse<PersonalizedOfferResponse[]>>(`${this.apiUrl}/offers/${userId}`);
  }

  // Phase 7: Sentiment Analysis
  analyzeReviews(): Observable<ApiResponse<SentimentAnalysisResult>> {
    return this.http.post<ApiResponse<SentimentAnalysisResult>>(`${this.apiUrl}/review/sentiment`, {});
  }

  // Phase 8: Chatbot
  sendChatMessage(request: ChatRequest): Observable<ApiResponse<ChatResponse>> {
    return this.http.post<ApiResponse<ChatResponse>>(`${this.apiUrl}/chat`, request);
  }

  // Phase 9: Delay Prediction
  getDelayPrediction(tripId: string): Observable<ApiResponse<DelayPredictionResponse>> {
    return this.http.get<ApiResponse<DelayPredictionResponse>>(`${this.apiUrl}/delay/${tripId}`);
  }
}
