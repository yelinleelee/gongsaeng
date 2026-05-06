import { useState } from "react";
import { createReview } from "../lib/reviews";
import type { ReviewInput } from "../types/review";
import { RatingStars } from "./RatingStars";
import { ApiError } from "../lib/api";

const SUB_RATINGS: { key: keyof ReviewInput; label: string }[] = [
  { key: "cleanliness", label: "청결도" },
  { key: "accuracy", label: "정확도" },
  { key: "communication", label: "소통" },
  { key: "location", label: "위치" },
  { key: "check_in", label: "체크인" },
  { key: "value", label: "가성비" },
];

export function ReviewForm({
  bookingId,
  onSubmitted,
  onCancel,
}: {
  bookingId: number;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [subs, setSubs] = useState<Record<string, number>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const input: ReviewInput = {
        booking_id: bookingId,
        rating,
        comment,
        cleanliness: subs.cleanliness,
        accuracy: subs.accuracy,
        communication: subs.communication,
        location: subs.location,
        check_in: subs.check_in,
        value: subs.value,
      };
      await createReview(input);
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "리뷰 작성 실패");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 p-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">전체 평점</p>
        <RatingStars value={rating} onChange={setRating} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SUB_RATINGS.map(({ key, label }) => (
          <div key={String(key)} className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{label}</span>
            <RatingStars
              size={14}
              value={subs[String(key)] ?? 0}
              onChange={(n) => setSubs((s) => ({ ...s, [String(key)]: n }))}
            />
          </div>
        ))}
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">코멘트</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          placeholder="숙소는 어땠나요?"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "제출 중…" : "리뷰 등록"}
        </button>
      </div>
    </form>
  );
}
