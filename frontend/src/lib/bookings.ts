import { api } from "./api";
import type { Booking, BookingInput, BookedRange } from "../types/booking";

export function createBooking(input: BookingInput): Promise<Booking> {
  return api<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listMyBookings(): Promise<Booking[]> {
  return api<Booking[]>("/bookings/my");
}

export function listHostBookings(): Promise<Booking[]> {
  return api<Booking[]>("/host/bookings");
}

export function getBooking(id: number): Promise<Booking> {
  return api<Booking>(`/bookings/${id}`);
}

export function cancelBooking(id: number, reason?: string): Promise<Booking> {
  return api<Booking>(`/bookings/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason: reason ?? "" }),
  });
}

export function approveBooking(id: number): Promise<Booking> {
  return api<Booking>(`/bookings/${id}/approve`, { method: "PATCH" });
}

export function getBookedDates(propertyId: number): Promise<BookedRange[]> {
  return api<BookedRange[]>(`/properties/${propertyId}/booked-dates`);
}
