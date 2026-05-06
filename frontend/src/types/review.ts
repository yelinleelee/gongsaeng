import type { PropertyHost } from "./property";

export type Review = {
  ID: number;
  CreatedAt: string;
  property_id: number;
  booking_id: number;
  user_id: number;
  user: PropertyHost;
  rating: number;
  comment: string;
  cleanliness: number;
  accuracy: number;
  communication: number;
  location: number;
  check_in: number;
  value: number;
};

export type ReviewInput = {
  booking_id: number;
  rating: number;
  comment?: string;
  cleanliness?: number;
  accuracy?: number;
  communication?: number;
  location?: number;
  check_in?: number;
  value?: number;
};
