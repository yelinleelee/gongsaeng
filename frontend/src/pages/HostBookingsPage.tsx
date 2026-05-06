import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { approveBooking, listHostBookings } from "../lib/bookings";
import type { Booking } from "../types/booking";
import { BookingStatusBadge } from "../components/BookingStatusBadge";
import { ApiError } from "../lib/api";
import { formatPrice } from "../lib/format";

export function HostBookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    listHostBookings()
      .then(setItems)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "예약 목록을 불러오지 못했습니다"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function onApprove(b: Booking) {
    try {
      await approveBooking(b.ID);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "승인 실패");
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">호스트 예약 관리</h1>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-500">아직 들어온 예약이 없습니다.</p>
      )}

      <ul className="space-y-3">
        {items.map((b) => (
          <li
            key={b.ID}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Link
                  to={`/stays/${b.property_id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {b.property?.title ?? `Property #${b.property_id}`}
                </Link>
                <BookingStatusBadge status={b.status} />
              </div>
              <p className="text-sm text-slate-600">
                게스트 {b.guest?.name ?? `#${b.guest_id}`} · 인원 {b.guests}명
              </p>
              <p className="text-sm text-slate-600">
                {b.check_in} → {b.check_out} · {formatPrice(b.total_price, b.currency)}
              </p>
              {b.special_requests && (
                <p className="text-xs text-slate-500">요청사항: {b.special_requests}</p>
              )}
            </div>

            {b.status === "pending" && (
              <button
                type="button"
                onClick={() => onApprove(b)}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                승인
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
