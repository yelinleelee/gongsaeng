import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { deleteProperty, listMyProperties } from "../lib/properties";
import type { Property } from "../types/property";
import { ApiError } from "../lib/api";
import { formatPrice } from "../lib/format";

export function HostDashboard() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    listMyProperties()
      .then(setItems)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "숙소 목록을 불러오지 못했습니다"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function onDelete(p: Property) {
    if (!window.confirm(`"${p.title}"을(를) 삭제할까요?`)) return;
    try {
      await deleteProperty(p.ID);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "삭제 실패");
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">호스트 대시보드</h1>
        <Link
          to="/host/register/type"
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Plus className="size-4" />
          숙소 등록
        </Link>
      </header>

      <div className="flex gap-3 text-sm">
        <Link
          to="/host"
          className="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
        >
          내 숙소
        </Link>
        <Link
          to="/host/bookings"
          className="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
        >
          예약 관리
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-500">아직 등록한 숙소가 없습니다.</p>
      )}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((p) => (
          <li
            key={p.ID}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          >
            <Link to={`/stays/${p.ID}`} className="block">
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>
            </Link>
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={`/stays/${p.ID}`}
                  className="line-clamp-1 font-medium hover:underline"
                >
                  {p.title}
                </Link>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.is_available
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {p.is_available ? "공개" : "비공개"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {p.city} · {formatPrice(p.price, p.currency)} / night
              </p>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => onDelete(p)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <Trash2 className="size-3.5" />
                  삭제
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
