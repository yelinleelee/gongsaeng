import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Frame,
  Heart,
  LayoutGrid,
  Map as MapIcon,
  MessageSquare,
  Mic,
  Package,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { fetchInstitutionFacilities } from "../data/seoul";
import { manualSpaces } from "../data/manualSpaces";
import { NaverMap } from "../components/NaverMap";

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
  SVCSTATNM?: string;
  X?: string;
  Y?: string;
}

interface DisplayFacility extends Facility {
  displayName: string;
  periodLabel?: string;
}

const MONTH_SUFFIX_RE = /\s*\(\d{2}\.\s*\d{1,2}월\)\s*$/;

function parseMonthSuffix(svcnm: string): { year: number; month: number } | null {
  const m = svcnm.match(/\((\d{2})\.\s*(\d{1,2})월\)\s*$/);
  if (!m) return null;
  return { year: parseInt(m[1], 10), month: parseInt(m[2], 10) };
}

function cleanSvcName(svcnm: string): string {
  return svcnm.replace(MONTH_SUFFIX_RE, "").trim();
}

function dedupeByPlace(rows: Facility[]): DisplayFacility[] {
  const groups = new Map<string, Facility[]>();
  for (const f of rows) {
    const key = `${f.PLACENM ?? ""}__${f.MINCLASSNM ?? ""}__${cleanSvcName(f.SVCNM)}`;
    let arr = groups.get(key);
    if (!arr) {
      arr = [];
      groups.set(key, arr);
    }
    arr.push(f);
  }

  return Array.from(groups.values()).map((group) => {
    const sorted = [...group].sort((a, b) => {
      const am = parseMonthSuffix(a.SVCNM);
      const bm = parseMonthSuffix(b.SVCNM);
      if (!am && !bm) return 0;
      if (!am) return 1;
      if (!bm) return -1;
      return am.year !== bm.year ? am.year - bm.year : am.month - bm.month;
    });
    const earliest = sorted[0];
    const months = sorted
      .map((f) => parseMonthSuffix(f.SVCNM))
      .filter((m): m is { year: number; month: number } => !!m);

    let periodLabel: string | undefined;
    if (months.length === 1) {
      periodLabel = `${months[0].month}월 예약 가능`;
    } else if (months.length > 1) {
      const min = months[0];
      const max = months[months.length - 1];
      periodLabel =
        min.month === max.month && min.year === max.year
          ? `${min.month}월 예약 가능`
          : `${min.month}월~${max.month}월 예약 가능`;
    }

    return {
      ...earliest,
      displayName: cleanSvcName(earliest.SVCNM),
      periodLabel,
    };
  });
}

const SEOUL_DISTRICTS = [
  "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구",
  "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구",
  "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구",
  "서초구", "강남구", "송파구", "강동구",
];

const CAPACITY_OPTIONS = ["10명 이하", "10~30명", "30~100명", "100명 이상"];

const ALLOWED_INSTITUTION = new Set(["강당", "광장", "녹화장소", "공연장", "회의실", "다목적실", "강의실"]);

// 일반 관람/체험 프로그램(시설대관이 아님) 제외용 키워드
const EXCLUDED_NAME_KEYWORDS = ["해설", "체험", "교육", "강좌", "수업", "탐방", "프로그램"];

const CATEGORY_MAP: Record<string, string[]> = {
  "공연장": ["공연장"],
  "다목적실": ["다목적실"],
  "전시·관람": ["전시/관람"],
  "강당·강의실": ["강당", "강의실"],
  "회의실": ["회의실"],
  "광장·야외": ["광장"],
  "녹화·촬영": ["녹화장소"],
};

const FIXED_CATEGORIES = ["전체", ...Object.keys(CATEGORY_MAP)];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  전체: <LayoutGrid className="size-4" />,
  "공연장": <Mic className="size-4" />,
  "다목적실": <Package className="size-4" />,
  "전시·관람": <Frame className="size-4" />,
  "강당·강의실": <Users className="size-4" />,
  "회의실": <MessageSquare className="size-4" />,
  "광장·야외": <MapIcon className="size-4" />,
  "녹화·촬영": <Camera className="size-4" />,
};

export function StaysPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [freeOnly, setFreeOnly] = useState(false);
  const [districtFilter, setDistrictFilter] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [statusOnly, setStatusOnly] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const handleMarkerClick = useCallback((id: string) => {
    setHighlightedId(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchInstitutionFacilities()
      .then((institutionData) => {
        if (cancelled) return;
        const institutionAllRows: Facility[] = institutionData?.ListPublicReservationInstitution?.row ?? [];
        const institutionRows = institutionAllRows.filter((f: Facility) => {
          if (!ALLOWED_INSTITUTION.has(f.MINCLASSNM ?? "")) return false;
          const name = f.SVCNM ?? "";
          if (EXCLUDED_NAME_KEYWORDS.some((k) => name.includes(k))) return false;
          return true;
        });

        const seen = new Set<string>();
        const allRows = [...institutionRows, ...manualSpaces].filter((f) => {
          const key = f.SVCID ?? `${f.SVCNM}__${f.PLACENM}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setFacilities(allRows);
      })
      .catch(() => {
        if (!cancelled) setError("데이터를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const activeFilterCount =
    (freeOnly ? 1 : 0) +
    (statusOnly ? 1 : 0) +
    (districtFilter ? 1 : 0) +
    (capacityFilter ? 1 : 0);

  function resetFilters() {
    setFreeOnly(false);
    setStatusOnly(false);
    setDistrictFilter("");
    setCapacityFilter("");
  }

  useEffect(() => {
    if (!highlightedId) return;
    const el = document.querySelector(`[data-facility-id="${CSS.escape(highlightedId)}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [highlightedId]);

  const filteredRaw = facilities.filter((f) => {
    if (freeOnly && f.PAYATNM !== "무료") return false;
    if (statusOnly && f.SVCSTATNM !== "접수중") return false;
    if (districtFilter && f.AREANM !== districtFilter) return false;
    if (capacityFilter && f.V_MAX) {
      const max = parseInt(f.V_MAX, 10);
      if (!isNaN(max)) {
        if (capacityFilter === "10명 이하" && max > 10) return false;
        if (capacityFilter === "10~30명" && (max <= 10 || max > 30)) return false;
        if (capacityFilter === "30~100명" && (max <= 30 || max > 100)) return false;
        if (capacityFilter === "100명 이상" && max < 100) return false;
      }
    }
    if (category !== "전체") {
      const allowed = CATEGORY_MAP[category];
      if (!allowed?.includes(f.MINCLASSNM ?? "")) return false;
    }
    if (query) {
      const combined = `${f.SVCNM} ${f.PLACENM} ${f.AREANM}`.toLowerCase();
      if (!combined.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const filtered = dedupeByPlace(filteredRaw);

  function toggleLike(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const ACTIVE_PILL = "border-slate-900 bg-slate-900 text-white";
  const INACTIVE_PILL = "border-slate-200 bg-white text-slate-700 hover:border-slate-400";

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
      {/* Controls */}
      <div className="flex-shrink-0 pt-6 pb-3 bg-white">
        {/* Search */}
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <Search className="size-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="공간명, 지역 검색"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Filter button + scrollable category chips */}
        <div ref={filterRef} className="relative flex items-center gap-3">
          <div className="relative shrink-0">
            <button
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeFilterCount > 0 || filterPanelOpen ? ACTIVE_PILL : INACTIVE_PILL
              }`}
            >
              <SlidersHorizontal className="size-4" />
              필터{activeFilterCount > 0 ? ` ${activeFilterCount}` : ""}
            </button>

            {filterPanelOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                <h3 className="mb-4 text-sm font-bold text-slate-900">필터</h3>

                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-700">대관료</p>
                    <button
                      onClick={() => setFreeOnly(!freeOnly)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        freeOnly ? ACTIVE_PILL : INACTIVE_PILL
                      }`}
                    >
                      무료만
                    </button>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-700">접수 상태</p>
                    <button
                      onClick={() => setStatusOnly(!statusOnly)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        statusOnly ? ACTIVE_PILL : INACTIVE_PILL
                      }`}
                    >
                      접수중만
                    </button>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-700">지역</p>
                    <select
                      value={districtFilter}
                      onChange={(e) => setDistrictFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                    >
                      <option value="">전체 지역</option>
                      {SEOUL_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-700">인원</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setCapacityFilter("")}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                          !capacityFilter ? ACTIVE_PILL : INACTIVE_PILL
                        }`}
                      >
                        전체
                      </button>
                      {CAPACITY_OPTIONS.map((o) => (
                        <button
                          key={o}
                          onClick={() => setCapacityFilter(o)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                            capacityFilter === o ? ACTIVE_PILL : INACTIVE_PILL
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={resetFilters}
                    className="text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-700"
                  >
                    초기화
                  </button>
                  <button
                    onClick={() => setFilterPanelOpen(false)}
                    className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    완료
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Vertical separator */}
          <div className="h-5 w-px shrink-0 bg-slate-200" />

          {/* Scrollable category chips */}
          <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FIXED_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold transition-colors ${
                  category === c
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-900 hover:bg-slate-50"
                }`}
              >
                {CATEGORY_ICONS[c] ?? <Package className="size-4" />}
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content: 좌측 카드 그리드(55%) + 우측 고정 지도(45%) */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <span className="text-sm font-semibold text-slate-400">불러오는 중...</span>
        </div>
      ) : error ? (
        <p className="py-8 text-sm text-red-600">{error}</p>
      ) : (
        <div className="flex flex-1 gap-5 overflow-hidden">
          {/* Left: scrollable card grid */}
          <div className="flex w-[55%] flex-col overflow-hidden">
            <p className="mb-3 flex-shrink-0 text-sm text-slate-500">
              공간 <span className="font-black text-slate-900">{filtered.length}곳</span>
            </p>
            <div className="flex-1 overflow-y-auto pr-1 pb-6">
              {filtered.length === 0 ? (
                <p className="py-16 text-center text-sm text-slate-400">조건에 맞는 공간이 없습니다.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-5 gap-y-8">
                  {filtered.map((f, i) => {
                    const id = f.SVCID ?? `${f.SVCNM}-${i}`;
                    return (
                      <GridCard
                        key={id}
                        facilityId={id}
                        facility={f}
                        isLiked={liked.has(id)}
                        onLike={(e) => toggleLike(id, e)}
                        isHighlighted={highlightedId === id}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: fixed map */}
          <div className="relative w-[45%] overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            <NaverMap
              facilities={filtered}
              highlightedId={highlightedId}
              onMarkerClick={handleMarkerClick}
            />
            <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold shadow-sm">
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-full bg-emerald-600" />
                무료
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-full bg-slate-900" />
                유료
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GridCard({
  facilityId,
  facility: f,
  isLiked,
  onLike,
  isHighlighted,
}: {
  facilityId: string;
  facility: DisplayFacility;
  isLiked: boolean;
  onLike: (e: React.MouseEvent) => void;
  isHighlighted?: boolean;
}) {
  const navigate = useNavigate();
  const isFree = f.PAYATNM === "무료";
  const name = f.displayName ?? f.SVCNM;
  return (
    <div
      data-facility-id={facilityId}
      onClick={() =>
        navigate(`/spaces/${encodeURIComponent(f.SVCID ?? facilityId)}`, {
          state: { facility: f },
        })
      }
      className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 bg-white transition-colors duration-200 ${
        isHighlighted ? "border-[#CCFF00]" : "border-slate-900 hover:border-[#CCFF00]"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {f.IMGURL ? (
          <img
            src={f.IMGURL}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-100">
            <svg className="size-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.2}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18a.75.75 0 00.75-.75V6a.75.75 0 00-.75-.75H3.75A.75.75 0 003 6v13.5a.75.75 0 00.75.75z"
              />
            </svg>
          </div>
        )}

        {/* Free badge — top left */}
        {isFree && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-900 shadow-sm">
            무료
          </span>
        )}

        {/* Category tag — bottom left */}
        {f.MINCLASSNM && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-slate-900/65 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {f.MINCLASSNM}
          </span>
        )}
      </div>

      {/* Below text */}
      <div className="p-3">
        <p className="truncate text-xs text-slate-400">
          {f.AREANM}{f.PLACENM ? ` · ${f.PLACENM}` : ""}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-700">
          {isFree ? "무료 대관" : f.PAYATNM || "유료"}
          {f.V_MAX ? ` · 최대 ${f.V_MAX}명` : ""}
        </p>
        {f.periodLabel && (
          <p className="mt-0.5 text-xs font-semibold text-emerald-700">{f.periodLabel}</p>
        )}
      </div>

      {/* Card-wide hover overlay — opaque green, title centered in the whole card */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#CCFF00] p-5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <p
          className="text-center text-2xl leading-tight text-slate-900"
          style={{ fontFamily: "'Black Han Sans', sans-serif" }}
        >
          {name}
        </p>
      </div>

      {/* Heart — top right, above overlay so still clickable on hover */}
      <button
        onClick={onLike}
        className="absolute right-2.5 top-2.5 z-30 transition-transform hover:scale-110"
      >
        <Heart
          className={`size-5 drop-shadow ${
            isLiked ? "fill-rose-500 text-rose-500" : "fill-black/25 text-white"
          }`}
        />
      </button>
    </div>
  );
}

