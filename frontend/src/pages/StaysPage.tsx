import { useEffect, useState } from "react";
import {
  Camera,
  Heart,
  MapPin,
  Mic,
  Music,
  Package,
  Search,
  Users,
} from "lucide-react";
import { fetchCultureEvents, fetchFacilities } from "../data/seoul";

interface Facility {
  SVCID?: string;
  SVCNM: string;
  PLACENM: string;
  AREANM: string;
  PAYATNM: string;
  IMGURL?: string;
  SVCURL?: string;
  MINCLASSNM?: string;
  MAXCLASSNM?: string;
  V_MAX?: string;
}

const CATEGORIES = [
  { value: "전체", label: "전체", icon: <Package className="size-3.5" /> },
  { value: "전시", label: "전시", icon: <Music className="size-3.5" /> },
  { value: "팝업", label: "팝업", icon: <Package className="size-3.5" /> },
  { value: "촬영", label: "촬영", icon: <Camera className="size-3.5" /> },
  { value: "워크숍", label: "워크숍", icon: <Users className="size-3.5" /> },
  { value: "공연", label: "공연", icon: <Mic className="size-3.5" /> },
];

const SORT_OPTIONS = [
  { value: "default", label: "기본순" },
  { value: "free", label: "무료 우선" },
  { value: "name", label: "가나다순" },
];

export function StaysPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState("default");
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchFacilities(), fetchCultureEvents()])
      .then(([sportData, cultureData]) => {
        if (cancelled) return;
        const sportRows: Facility[] =
          sportData?.ListPublicReservationSport?.row ?? [];
        const cultureRows: Facility[] =
          cultureData?.ListPublicReservationCulture?.row ?? [];
        setFacilities([...cultureRows, ...sportRows]);
      })
      .catch(() => {
        if (!cancelled) setError("데이터를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = facilities
    .filter((f) => {
      if (freeOnly && f.PAYATNM !== "무료") return false;
      if (category !== "전체") {
        const combined = `${f.SVCNM} ${f.MINCLASSNM ?? ""} ${f.MAXCLASSNM ?? ""}`;
        if (!combined.includes(category)) return false;
      }
      if (query) {
        const combined =
          `${f.SVCNM} ${f.PLACENM} ${f.AREANM}`.toLowerCase();
        if (!combined.includes(query.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "free") {
        if (a.PAYATNM === "무료" && b.PAYATNM !== "무료") return -1;
        if (a.PAYATNM !== "무료" && b.PAYATNM === "무료") return 1;
        return 0;
      }
      if (sort === "name") return a.SVCNM.localeCompare(b.SVCNM, "ko");
      return 0;
    });

  function toggleLike(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-6">
          공간 찾기
        </h1>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors
                ${
                  category === c.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                }`}
            >
              {c.icon}
              {c.label}
            </button>
          ))}
          <button
            onClick={() => setFreeOnly(!freeOnly)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors
              ${
                freeOnly
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
          >
            무료만
          </button>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search className="size-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="공간명, 지역 검색"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Count + sort */}
      {!loading && !error && (
        <div className="mb-5 flex items-center justify-between">
          <span className="text-base font-black text-slate-900">
            공간{" "}
            <span className="text-emerald-600">{filtered.length}곳</span>
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-24">
          <span className="text-slate-400 font-semibold">불러오는 중...</span>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 py-8">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <p className="col-span-full py-16 text-center text-sm font-semibold text-slate-400">
              조건에 맞는 공간이 없습니다.
            </p>
          ) : (
            filtered.map((f, i) => {
              const id = f.SVCID ?? `${f.SVCNM}-${i}`;
              return (
                <FacilityCard
                  key={id}
                  facility={f}
                  isLiked={liked.has(id)}
                  onLike={(e) => toggleLike(id, e)}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function FacilityCard({
  facility: f,
  isLiked,
  onLike,
}: {
  facility: Facility;
  isLiked: boolean;
  onLike: (e: React.MouseEvent) => void;
}) {
  const isFree = f.PAYATNM === "무료";

  return (
    <div
      onClick={() => f.SVCURL && window.open(f.SVCURL, "_blank")}
      className="group cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 mb-3">
        {f.IMGURL ? (
          <img
            src={f.IMGURL}
            alt={f.SVCNM}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-100">
            <svg
              className="size-14 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.2}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18a.75.75 0 00.75-.75V6a.75.75 0 00-.75-.75H3.75A.75.75 0 003 6v13.5a.75.75 0 00.75.75z"
              />
            </svg>
          </div>
        )}

        {/* Top-left tags */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {f.MINCLASSNM && (
            <span className="rounded-md bg-slate-900/75 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white">
              {f.MINCLASSNM}
            </span>
          )}
          {isFree && (
            <span className="rounded-md bg-slate-900/75 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white">
              무료
            </span>
          )}
        </div>

        {/* Top-right bookmark */}
        <button
          onClick={onLike}
          className="absolute top-3 right-3 transition-transform hover:scale-110"
        >
          <Heart
            className={`size-5 drop-shadow transition-colors ${
              isLiked
                ? "fill-rose-500 text-rose-500"
                : "fill-white/40 text-white"
            }`}
          />
        </button>
      </div>

      {/* Text content */}
      <div className="px-1">
        <h3 className="font-bold text-[15px] leading-snug text-slate-900 mb-0.5 line-clamp-1">
          {f.SVCNM}
        </h3>
        <p className="text-sm text-slate-400 mb-1.5 truncate">
          {f.AREANM}
          {f.PLACENM ? ` · ${f.PLACENM}` : ""}
          {f.V_MAX ? ` · 최대 ${f.V_MAX}명` : ""}
        </p>
        <p
          className={`text-sm font-bold ${isFree ? "text-emerald-600" : "text-slate-800"}`}
        >
          {isFree ? "무료 대관" : f.PAYATNM || "유료"}
        </p>
      </div>
    </div>
  );
}
