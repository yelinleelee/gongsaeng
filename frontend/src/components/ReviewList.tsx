import { useEffect, useState } from "react";
import { listPropertyReviews } from "../lib/reviews";
import type { Review } from "../types/review";
import { RatingStars } from "./RatingStars";

export function ReviewList({ propertyId, refreshKey }: { propertyId: number; refreshKey?: number }) {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPropertyReviews(propertyId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [propertyId, refreshKey]);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">아직 리뷰가 없습니다.</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((r) => (
        <li key={r.ID} className="rounded-md border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {r.user.avatar ? (
                <img
                  src={r.user.avatar}
                  alt=""
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                  {r.user.name?.[0] ?? "?"}
                </div>
              )}
              <div className="leading-tight">
                <p className="text-sm font-medium text-slate-900">{r.user.name}</p>
                <p className="text-xs text-slate-500">
                  {new Date(r.CreatedAt).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </div>
            <RatingStars value={r.rating} readOnly size={14} />
          </div>
          {r.comment && <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{r.comment}</p>}
        </li>
      ))}
    </ul>
  );
}
