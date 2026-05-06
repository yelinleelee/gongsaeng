import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cancelBooking, listMyBookings } from "../lib/bookings";
import type { Booking } from "../types/booking";
import { BookingStatusBadge } from "../components/BookingStatusBadge";
import { ApiError } from "../lib/api";
import { formatPrice } from "../lib/format";
import { ReviewForm } from "../components/ReviewForm";

export function MyBookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<number | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    listMyBookings()
      .then(setItems)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "예약 목록을 불러오지 못했습니다"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function onCancel(b: Booking) {
    const reason = window.prompt("취소 사유 (선택사항)") ?? "";
    try {
      await cancelBooking(b.ID, reason);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "취소 실패");
    }
  }

  function isReviewable(b: Booking) {
    if (b.status === "cancelled") return false;
    return new Date(b.check_out) <= new Date();
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">내 예약</h1>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-500">아직 예약 내역이 없습니다.</p>
      )}

      <ul className="space-y-3">
        {items.map((b) => (
          <li key={b.ID} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  {b.check_in} → {b.check_out} · 인원 {b.guests}명
                </p>
                <p className="text-sm text-slate-600">
                  합계 {formatPrice(b.total_price, b.currency)}
                </p>
              </div>

              <div className="flex gap-2">
                {isReviewable(b) && (
                  <button
                    type="button"
                    onClick={() => setReviewing(reviewing === b.ID ? null : b.ID)}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {reviewing === b.ID ? "닫기" : "리뷰 작성"}
                  </button>
                )}
                {b.status !== "cancelled" && b.status !== "completed" && (
                  <button
                    type="button"
                    onClick={() => onCancel(b)}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    취소
                  </button>
                )}
              </div>
            </div>

            {reviewing === b.ID && (
              <div className="mt-4">
                <ReviewForm
                  bookingId={b.ID}
                  onCancel={() => setReviewing(null)}
                  onSubmitted={() => {
                    setReviewing(null);
                    reload();
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
