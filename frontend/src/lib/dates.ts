// Local-time YYYY-MM-DD helpers — avoids the UTC drift you get from Date#toISOString.

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function diffNights(checkIn: Date, checkOut: Date): number {
  const ms = startOfDay(checkOut).getTime() - startOfDay(checkIn).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// Expand a [checkIn, checkOut) range into the set of occupied night-start dates
// (check-out itself is free for a same-day check-in).
export function expandOccupied(checkIn: string, checkOut: string): string[] {
  const start = fromISODate(checkIn);
  const end = fromISODate(checkOut);
  const out: string[] = [];
  for (let d = start; d < end; d = addDays(d, 1)) {
    out.push(toISODate(d));
  }
  return out;
}
