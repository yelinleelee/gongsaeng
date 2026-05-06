import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Property } from "../types/property";
import { useAuth } from "../auth/AuthContext";
import { Calendar } from "./Calendar";
import { createBooking, getBookedDates } from "../lib/bookings";
import { ApiError } from "../lib/api";
import { diffNights, expandOccupied } from "../lib/dates";
import { formatPrice } from "../lib/format";

export function BookingWidget({ property }: { property: Property }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [guests, setGuests] = useState(1);
  const [occupied, setOccupied] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBookedDates(property.ID)
      .then((ranges) => {
        if (cancelled) return;
        const days = new Set<string>();
        for (const r of ranges) {
          for (const d of expandOccupied(r.check_in, r.check_out)) days.add(d);
        }
        setOccupied(days);
      })
      .catch(() => {
        /* ignore — calendar still usable */
      });
    return () => {
      cancelled = true;
    };
  }, [property.ID]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return diffNights(new Date(checkIn), new Date(checkOut));
  }, [checkIn, checkOut]);

  const total = nights * property.price;
  const isOwnProperty = user?.id === property.host_id;

  async function handleBook() {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/stays/${property.ID}` } } });
      return;
    }
    if (!checkIn || !checkOut) {
      setError("체크인/체크아웃을 선택하세요");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const booking = await createBooking({
        property_id: property.ID,
        check_in: checkIn,
        check_out: checkOut,
        guests,
      });
      navigate(`/bookings/my`, { state: { highlight: booking.ID } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "예약 실패");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-semibold">
          {formatPrice(property.price, property.currency)}
          <span className="ml-1 text-sm font-normal text-slate-500">/ night</span>
        </p>
      </div>

      <Calendar
        checkIn={checkIn}
        checkOut={checkOut}
        occupied={occupied}
        onChange={({ checkIn, checkOut }) => {
          setCheckIn(checkIn);
          setCheckOut(checkOut);
          setError(null);
        }}
      />

      <label className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
        <span className="text-slate-600">인원</span>
        <input
          type="number"
          min={1}
          max={property.max_guests}
          value={guests}
          onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
          className="w-16 bg-transparent text-right outline-none"
        />
      </label>

      {nights > 0 && (
        <div className="space-y-1 rounded-md bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>
              {formatPrice(property.price, property.currency)} × {nights}박
            </span>
            <span>{formatPrice(total, property.currency)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
            <span>합계</span>
            <span>{formatPrice(total, property.currency)}</span>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleBook}
        disabled={pending || isOwnProperty}
        className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isOwnProperty ? "본인 숙소는 예약 불가" : pending ? "예약 중…" : "예약하기"}
      </button>
    </div>
  );
}
