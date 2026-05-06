import type { BookingStatus } from "../types/booking";

const STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-200 text-slate-600",
  completed: "bg-slate-900 text-white",
};

const LABELS: Record<BookingStatus, string> = {
  pending: "대기 중",
  confirmed: "확정",
  cancelled: "취소됨",
  completed: "완료",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
