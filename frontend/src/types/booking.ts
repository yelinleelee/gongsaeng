import type { Property, PropertyHost } from "./property";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

export type Booking = {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;

  property_id: number;
  property: Property;

  guest_id: number;
  guest: PropertyHost;

  check_in: string;
  check_out: string;
  guests: number;

  total_price: number;
  currency: string;

  status: BookingStatus;
  payment_status: PaymentStatus;

  special_requests: string;
  cancelled_at: string | null;
  cancellation_reason: string;
};

export type BookedRange = {
  check_in: string;
  check_out: string;
};

export type BookingInput = {
  property_id: number;
  check_in: string;
  check_out: string;
  guests?: number;
  special_requests?: string;
};
