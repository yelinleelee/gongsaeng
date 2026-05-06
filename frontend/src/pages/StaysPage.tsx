import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { listProperties } from "../lib/properties";
import type { Property, PropertyFilters, PropertyType } from "../types/property";
import { StayCard } from "../components/StayCard";
import { ApiError } from "../lib/api";

const PROPERTY_TYPES: { value: PropertyType | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "apartment", label: "아파트" },
  { value: "house", label: "주택" },
  { value: "villa", label: "빌라" },
  { value: "guesthouse", label: "게스트하우스" },
  { value: "hotel", label: "호텔" },
  { value: "unique", label: "독특한 숙소" },
];

export function StaysPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo<PropertyFilters>(
    () => ({
      city: searchParams.get("city") ?? undefined,
      property_type: (searchParams.get("property_type") as PropertyType) || undefined,
      min_price: searchParams.get("min_price")
        ? Number(searchParams.get("min_price"))
        : undefined,
      max_price: searchParams.get("max_price")
        ? Number(searchParams.get("max_price"))
        : undefined,
      guests: searchParams.get("guests") ? Number(searchParams.get("guests")) : undefined,
    }),
    [searchParams],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listProperties(filters)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "숙소를 불러오지 못했습니다");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "") next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Stays</h1>
        <p className="text-sm text-slate-500">취향에 맞는 숙소를 찾아보세요.</p>
      </header>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <label className="flex flex-1 min-w-48 flex-col gap-1 text-xs text-slate-600">
          도시
          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
            <Search className="size-4 text-slate-400" />
            <input
              type="text"
              defaultValue={filters.city ?? ""}
              onBlur={(e) => setParam("city", e.target.value || undefined)}
              placeholder="서울, 제주…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-600">
          숙소 유형
          <select
            value={filters.property_type ?? ""}
            onChange={(e) => setParam("property_type", e.target.value || undefined)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-600">
          인원
          <input
            type="number"
            min={1}
            defaultValue={filters.guests ?? ""}
            onBlur={(e) => setParam("guests", e.target.value || undefined)}
            className="w-24 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-600">
          최소 가격
          <input
            type="number"
            min={0}
            defaultValue={filters.min_price ?? ""}
            onBlur={(e) => setParam("min_price", e.target.value || undefined)}
            className="w-32 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-600">
          최대 가격
          <input
            type="number"
            min={0}
            defaultValue={filters.max_price ?? ""}
            onBlur={(e) => setParam("max_price", e.target.value || undefined)}
            className="w-32 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </form>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-500">조건에 맞는 숙소가 없습니다.</p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <StayCard key={p.ID} property={p} />
        ))}
      </div>
    </section>
  );
}
