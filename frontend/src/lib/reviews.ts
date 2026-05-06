import { api } from "./api";
import type { Review, ReviewInput } from "../types/review";

export function listPropertyReviews(propertyId: number): Promise<Review[]> {
  return api<Review[]>(`/properties/${propertyId}/reviews`);
}

export function createReview(input: ReviewInput): Promise<Review> {
  return api<Review>("/reviews", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
