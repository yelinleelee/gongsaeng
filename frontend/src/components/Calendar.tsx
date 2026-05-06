import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, fromISODate, startOfDay, toISODate } from "../lib/dates";

type Props = {
  checkIn: string | null;
  checkOut: string | null;
  occupied: Set<string>;
  onChange: (range: { checkIn: string | null; checkOut: string | null }) => void;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function Calendar({ checkIn, checkOut, occupied, onChange }: Props) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);

  function onClickDate(date: Date) {
    const iso = toISODate(date);
    if (date < today) return;
    if (occupied.has(iso)) return;

    if (!checkIn || (checkIn && checkOut)) {
      onChange({ checkIn: iso, checkOut: null });
      return;
    }
    const inDate = fromISODate(checkIn);
    if (date <= inDate) {
      onChange({ checkIn: iso, checkOut: null });
      return;
    }
    if (rangeHasOccupied(checkIn, iso, occupied)) {
      onChange({ checkIn: iso, checkOut: null });
      return;
    }
    onChange({ checkIn, checkOut: iso });
  }

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(addMonths(cursor, -1))}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-medium">
          {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
        </p>
        <button
          type="button"
          onClick={() => setCursor(addMonths(cursor, 1))}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </header>

      <div className="grid grid-cols-7 text-center text-xs text-slate-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-sm">
        {grid.map(({ date, inMonth }) => {
          const iso = toISODate(date);
          const isPast = date < today;
          const isOccupied = occupied.has(iso);
          const isCheckIn = checkIn === iso;
          const isCheckOut = checkOut === iso;
          const inRange =
            checkIn && checkOut && date > fromISODate(checkIn) && date < fromISODate(checkOut);
          const disabled = !inMonth || isPast || isOccupied;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onClickDate(date)}
              className={[
                "h-9 rounded-md text-sm transition",
                !inMonth ? "text-slate-300" : "",
                disabled && inMonth && !isOccupied ? "text-slate-300" : "",
                isOccupied ? "text-slate-300 line-through" : "",
                !disabled && !isCheckIn && !isCheckOut && !inRange
                  ? "hover:bg-slate-100"
                  : "",
                inRange ? "bg-slate-100" : "",
                isCheckIn || isCheckOut ? "bg-slate-900 text-white" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildMonthGrid(cursor: Date) {
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startWeekday = firstOfMonth.getDay();
  const start = addDays(firstOfMonth, -startWeekday);
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(start, i);
    return { date, inMonth: date.getMonth() === cursor.getMonth() };
  });
}

function rangeHasOccupied(start: string, end: string, occupied: Set<string>) {
  let cur = fromISODate(start);
  const last = fromISODate(end);
  while (cur < last) {
    if (occupied.has(toISODate(cur))) return true;
    cur = addDays(cur, 1);
  }
  return false;
}
