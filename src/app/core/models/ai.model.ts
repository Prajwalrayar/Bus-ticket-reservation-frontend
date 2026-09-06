import { TripDTO } from './trip';

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response: string;
}

export interface AiSearchRequest {
  query: string;
}

export interface RecommendationResponse {
  trip: TripDTO;
  recommendationScore: number;
  reasoning: string;
}

export interface TravelOptionResponse {
  optionId: string;
  totalFare: number;
  totalDuration: string;
  departureTime: string;
  arrivalTime: string;
  numberOfTransfers: number;
  travelScore: number;
  legs: TripDTO[];
  reasoning: string;
}

export interface DemandPredictionResponse {
  tripId: string;
  predictedOccupancyPercentage: number;
  demandClassification: string;
  factors: string;
}

export interface DynamicPricingResponse {
  tripId: string;
  baseFare: number;
  simulatedDynamicFare: number;
  demandClassification: string;
  scarcityMultiplier: number;
  pricingReasoning: string;
}

export interface PersonalizedOfferResponse {
  offerId: string;
  userId: string;
  offerCode: string;
  discountPercentage: number;
  reasoning: string;
  validUntil: string;
  isUsed: boolean;
}

export interface SentimentAnalysisResult {
  totalReviewsAnalyzed: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  averageSentimentScore: number;
}

export interface DelayPredictionResponse {
  tripId: string;
  scheduledArrivalTime: string;
  expectedArrivalTime: string;
  delayProbability: number;
  reasoning: string;
}
