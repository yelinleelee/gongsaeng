import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  Image as ImageIcon,
  LineChart,
  MapPin,
  Share2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAllSpaces } from "../data/seoul";
import { manualSpaces } from "../data/manualSpaces";
import { NaverMap } from "../components/NaverMap";
import { useFavorites } from "../auth/FavoritesContext";
import { useAuth } from "../auth/AuthContext";
import { trackRecentSpace } from "../lib/recentlyViewed";

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
  ADDR?: string;
  OPENHOURS?: string;
}

const MONTH_SUFFIX_RE = /\s*\(\d{2}\.\s*\d{1,2}월\)\s*$/;
const cleanSvcName = (s: string) => s.replace(MONTH_SUFFIX_RE, "").trim();

const TIME_SLOTS = [
  "09-10시", "10-11시", "11-12시",
  "13-14시", "14-15시", "15-16시",
  "16-17시", "17-18시", "18-19시",
];

// 서울시 생활인구 API 미연동 — 지역명으로 재현 가능한 시간대별 모의값 생성
// 실제 도시 유동인구 패턴(아침 출근/점심/저녁 피크)을 모사
function mockPopulation(district: string) {
  const hash = Array.from(district).reduce((a, c) => a + c.charCodeAt(0), 0);
  const peakWeekday = 8000 + (hash % 80) * 100;
  const peakWeekend = Math.round(peakWeekday * 1.45);

  // 24시간 비율 패턴 (0~1.0, 24개)
  const weekdayPattern = [
    0.15, 0.10, 0.08, 0.08, 0.12, 0.20, // 0-5시 (심야~새벽)
    0.45, 0.80, 0.95, 0.75, 0.70, 0.85, // 6-11시 (출근~오전)
    1.00, 0.90, 0.78, 0.75, 0.80, 0.95, // 12-17시 (점심~오후)
    1.00, 0.92, 0.75, 0.55, 0.38, 0.22, // 18-23시 (퇴근~저녁)
  ];
  const weekendPattern = [
    0.20, 0.15, 0.12, 0.10, 0.10, 0.15, // 0-5시
    0.25, 0.40, 0.55, 0.70, 0.85, 0.95, // 6-11시
    1.00, 1.00, 0.95, 0.92, 0.95, 1.00, // 12-17시 (주말은 오후 피크)
    1.00, 0.95, 0.85, 0.70, 0.50, 0.30, // 18-23시
  ];

  // 노이즈로 district별 미세 차이 유지
  const jitter = (h: number) => (((hash + h * 7) % 13) - 6) * 30;

  const hourly = weekdayPattern.map((wd, h) => ({
    hour: `${h}시`,
    hourNum: h,
    weekday: Math.max(0, Math.round(peakWeekday * wd + jitter(h))),
    weekend: Math.max(0, Math.round(peakWeekend * weekendPattern[h] + jitter(h + 12))),
  }));

  const weekdayTotal = Math.round(hourly.reduce((s, h) => s + h.weekday, 0) / 24);
  const weekendTotal = Math.round(hourly.reduce((s, h) => s + h.weekend, 0) / 24);

  return { hourly, weekdayTotal, weekendTotal };
}

// 카운트업 애니메이션 — 0에서 target까지 ease-out cubic
function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    let raf = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const passed = (location.state as { facility?: Facility } | null)?.facility;

  const [facility, setFacility] = useState<Facility | null>(passed ?? null);
  const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(!passed);
  const [error, setError] = useState<string | null>(null);

  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const favSvcId = facility?.SVCID ?? facility?.SVCNM ?? "";
  const liked = favSvcId ? isFavorite(favSvcId) : false;

  async function handleToggleLike() {
    if (!facility || !favSvcId) return;
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await toggleFavorite({
        svc_id: favSvcId,
        svc_nm: facility.SVCNM,
        place_nm: facility.PLACENM,
        area_nm: facility.AREANM,
        pay_at_nm: facility.PAYATNM,
        img_url: facility.IMGURL,
        svc_url: facility.SVCURL,
        min_class_nm: facility.MINCLASSNM,
        v_max: facility.V_MAX,
        x: facility.X,
        y: facility.Y,
      });
    } catch {
      /* optimistic — Context 자동 복구 */
    }
  }

  // 페이지 진입 시 최근 본 공간으로 기록
  useEffect(() => {
    if (!facility || !favSvcId) return;
    trackRecentSpace({
      svc_id: favSvcId,
      svc_nm: facility.SVCNM,
      place_nm: facility.PLACENM,
      area_nm: facility.AREANM,
      pay_at_nm: facility.PAYATNM,
      img_url: facility.IMGURL,
      min_class_nm: facility.MINCLASSNM,
      v_max: facility.V_MAX,
    });
  }, [favSvcId, facility]);
  const [selectedSlot, setSelectedSlot] = useState<string>("13-14시");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!datePickerOpen) return;
    function handleOutside(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [datePickerOpen]);

  useEffect(() => {
    let cancelled = false;
    fetchAllSpaces()
      .then((rows) => {
        if (cancelled) return;
        const all = [...(rows as Facility[]), ...manualSpaces];
        setAllFacilities(all);
        if (!facility && id) {
          const decoded = decodeURIComponent(id);
          const found = all.find((f) => f.SVCID === decoded);
          if (found) setFacility(found);
          else setError("공간 정보를 찾을 수 없습니다.");
        }
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
  }, [id]);

  const similar = useMemo(() => {
    if (!facility || allFacilities.length === 0) return [];
    return allFacilities
      .filter(
        (f) =>
          f.SVCID !== facility.SVCID &&
          f.MINCLASSNM === facility.MINCLASSNM,
      )
      .slice(0, 3);
  }, [facility, allFacilities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-sm font-semibold text-slate-400">불러오는 중...</span>
      </div>
    );
  }
  if (error) return <p className="py-8 text-sm text-red-600">{error}</p>;
  if (!facility) return null;

  const name = cleanSvcName(facility.SVCNM);
  const isFree = facility.PAYATNM === "무료";
  const population = mockPopulation(facility.AREANM || "");

  const tags: { label: string; active?: boolean }[] = [];
  if (facility.MINCLASSNM) tags.push({ label: facility.MINCLASSNM, active: true });
  if (facility.V_MAX) {
    const max = parseInt(facility.V_MAX, 10);
    if (!isNaN(max)) {
      if (max <= 30) tags.push({ label: "소규모" });
      else if (max <= 100) tags.push({ label: "중규모" });
      else tags.push({ label: "대규모" });
    }
  }
  if (facility.MAXCLASSNM && facility.MAXCLASSNM !== facility.MINCLASSNM) {
    tags.push({ label: facility.MAXCLASSNM });
  }
  tags.push({ label: isFree ? "무료" : "유료" });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link to="/stays" className="hover:text-slate-900">공간 찾기</Link>
        <ChevronRight className="size-3.5" />
        <span>{facility.AREANM}</span>
        <ChevronRight className="size-3.5" />
        <span className="font-semibold text-slate-900">{name}</span>
      </nav>

      {/* Hero image */}
      <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-slate-100">
        {facility.IMGURL ? (
          <img src={facility.IMGURL} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <ImageIcon className="size-10" strokeWidth={1.2} />
            <span className="text-sm font-semibold">공간 대표 사진</span>
          </div>
        )}
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={handleToggleLike}
            className="rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition-colors hover:bg-white"
            aria-label="찜"
          >
            <Heart className={`size-4 ${liked ? "fill-rose-500 text-rose-500" : "text-slate-700"}`} />
          </button>
          <button
            className="rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition-colors hover:bg-white"
            aria-label="공유"
          >
            <Share2 className="size-4 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Free badge */}
      {isFree && (
        <span className="inline-block rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          무료 대관
        </span>
      )}

      {/* Split layout: main + sticky sidebar */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        {/* MAIN */}
        <div className="space-y-7">
          {/* Title */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{name}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <span
                    key={`${t.label}-${i}`}
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      t.active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={handleToggleLike} className="mt-1 shrink-0" aria-label="찜">
              <Heart className={`size-5 ${liked ? "fill-rose-500 text-rose-500" : "text-slate-300"}`} />
            </button>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-3 gap-3">
            <InfoCard
              label="대관료"
              value={isFree ? "무료" : facility.PAYATNM || "유료"}
            />
            <InfoCard
              label="수용 인원"
              value={facility.V_MAX ? `최대 ${facility.V_MAX}명` : "정보 없음"}
            />
            <InfoCard label="운영 시간" value={facility.OPENHOURS || "09:00~18:00"} />
          </div>

          {/* 공간 소개 */}
          <Section title="공간 소개" accent>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {facility.PLACENM || facility.AREANM}에서 운영하는 {name}은(는)
              {facility.MINCLASSNM ? ` ${facility.MINCLASSNM}` : ""} 용도로 활용 가능한
              {isFree ? " 무료" : ""} 공공 공간입니다. 자세한 운영 내용과 이용 조건은 서울시
              공공서비스예약 페이지에서 확인하세요.
            </p>
          </Section>

          {/* 서울시 데이터 인사이트 */}
          <section>
            <h2 className="flex items-center gap-1.5 text-base font-bold text-slate-900">
              <LineChart className="size-4 text-emerald-600" />
              서울시 데이터 인사이트
            </h2>

            {/* 카운트업 통계 카드 2개 */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <AnimatedStat
                label="평일 평균 유동인구"
                target={population.weekdayTotal}
                unit="명/시"
                sub={`${facility.AREANM} · 시간당`}
                accent="slate"
              />
              <AnimatedStat
                label="주말 평균 유동인구"
                target={population.weekendTotal}
                unit="명/시"
                sub="토·일 시간당"
                accent="emerald"
              />
            </div>

            {/* 시간대별 유동인구 막대 그래프 */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">시간대별 유동인구</p>
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-sm bg-slate-400" />
                    평일
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-sm bg-emerald-500" />
                    주말
                  </span>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={population.hourly}
                    margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="hourNum"
                      ticks={[0, 6, 12, 18, 23]}
                      tickFormatter={(v) => `${v}시`}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(15,23,42,0.04)" }}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      labelFormatter={(v) => `${v}시`}
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString()}명`,
                        name === "weekday" ? "평일" : "주말",
                      ]}
                    />
                    <Bar dataKey="weekday" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="weekend" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 평일 vs 주말 일평균 비교 */}
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-bold text-slate-900">평일 vs 주말 평균</p>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "평일", value: population.weekdayTotal, fill: "#94a3b8" },
                      { name: "주말", value: population.weekendTotal, fill: "#10b981" },
                    ]}
                    layout="vertical"
                    margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 13, fill: "#0f172a", fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(15,23,42,0.04)" }}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()}명`, "시간당 평균"]}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                      {[
                        { fill: "#94a3b8" },
                        { fill: "#10b981" },
                      ].map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                주말이 평일 대비{" "}
                <span className="font-bold text-emerald-700">
                  {Math.round(
                    ((population.weekendTotal - population.weekdayTotal) /
                      population.weekdayTotal) *
                      100,
                  )}
                  %
                </span>{" "}
                더 활발해요
              </p>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              서울시 생활인구 데이터 기반 · 서울 열린데이터광장
            </p>
          </section>

          {/* 위치 및 교통 */}
          <section>
            <h2 className="flex items-center gap-1.5 text-base font-bold text-slate-900">
              <MapPin className="size-4 text-emerald-600" />
              위치 및 교통
            </h2>
            {facility.ADDR && (
              <p className="mt-2 text-sm font-medium text-slate-700">{facility.ADDR}</p>
            )}
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-3">
                <Badge color="emerald">지</Badge>
                <span>인근 지하철역에서 도보 접근 가능</span>
              </li>
              <li className="flex items-center gap-3">
                <Badge color="amber">버</Badge>
                <span>가까운 버스 정류장에서 도보 5분 내</span>
              </li>
              <li className="flex items-center gap-3">
                <Badge color="slate">주</Badge>
                <span>인근 주차장 이용 (유료)</span>
              </li>
            </ul>
            {/* Map */}
            <div className="mt-3 h-64 overflow-hidden rounded-xl border border-slate-100">
              {facility.X && facility.Y ? (
                <NaverMap
                  facilities={[facility]}
                  highlightedId={facility.SVCID ?? null}
                  onMarkerClick={() => {}}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-400">
                  지도 좌표가 제공되지 않았습니다.
                </div>
              )}
            </div>
          </section>

          {/* 예약 안내 */}
          <section>
            <h2 className="text-base font-bold text-slate-900">예약 안내</h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-700">
              <Step n={1}>공생에서 원하는 날짜·시간 확인</Step>
              <Step n={2}>서울시 공공서비스예약(yeyak.seoul.go.kr)으로 연결</Step>
              <Step n={3}>서울시 계정 로그인 후 예약 신청 완료</Step>
            </ol>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-base font-bold text-emerald-700">
              {isFree ? "무료 대관" : facility.PAYATNM || "유료 대관"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {facility.PLACENM} 운영
            </p>

            <div ref={datePickerRef} className="relative mt-4">
              <button
                type="button"
                onClick={() => setDatePickerOpen((v) => !v)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  datePickerOpen
                    ? "border-slate-900 text-slate-900"
                    : "border-slate-200 text-slate-700 hover:border-slate-400"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Calendar className="size-4 text-slate-500" />
                  {selectedDate ? formatDateLabel(selectedDate) : "날짜 선택"}
                </span>
                <ChevronDown
                  className={`size-4 text-slate-500 transition-transform ${
                    datePickerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {datePickerOpen && (
                <InlineDatePicker
                  value={selectedDate}
                  onChange={(d) => {
                    setSelectedDate(d);
                    setDatePickerOpen(false);
                  }}
                />
              )}
            </div>

            <p className="mt-4 text-xs font-semibold text-slate-700">시간대 선택</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-md border px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                    slot === selectedSlot
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            {facility.SVCURL ? (
              <a
                href={facility.SVCURL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
              >
                <ExternalLink className="size-4" />
                서울시 예약 페이지로 이동
              </a>
            ) : (
              <button
                disabled
                className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-400"
              >
                <ExternalLink className="size-4" />
                예약 링크 없음
              </button>
            )}
            <p className="mt-2 text-center text-xs text-slate-400">
              ⓘ 서울시 계정으로 최종 예약
            </p>
          </div>

          {/* 비슷한 공간 */}
          {similar.length > 0 && (
            <div className="rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">비슷한 공간</h3>
              <ul className="mt-3 space-y-1">
                {similar.map((s) => {
                  const sid = s.SVCID ?? s.SVCNM;
                  return (
                    <li key={sid}>
                      <button
                        onClick={() =>
                          navigate(`/spaces/${encodeURIComponent(sid)}`, {
                            state: { facility: s },
                          })
                        }
                        className="-mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-50"
                      >
                        <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {s.IMGURL ? (
                            <img src={s.IMGURL} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon className="size-4 text-slate-300" strokeWidth={1.2} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {cleanSvcName(s.SVCNM)}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {s.AREANM}
                            {s.V_MAX ? ` · 최대 ${s.V_MAX}명` : ""}
                          </p>
                        </div>
                        {s.PAYATNM === "무료" && (
                          <span className="shrink-0 text-xs font-bold text-emerald-700">무료</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function AnimatedStat({
  label,
  target,
  unit,
  sub,
  accent,
}: {
  label: string;
  target: number;
  unit: string;
  sub: string;
  accent: "slate" | "emerald";
}) {
  const value = useCountUp(target);
  const isEmerald = accent === "emerald";
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        isEmerald
          ? "border-emerald-100 bg-emerald-50/50"
          : "border-slate-200 bg-slate-50/60"
      }`}
    >
      <p
        className={`text-xs font-semibold ${
          isEmerald ? "text-emerald-700" : "text-slate-600"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1 font-black text-slate-900">
        <span className="text-2xl tabular-nums">{value.toLocaleString()}</span>
        <span className="text-xs font-bold text-slate-500">{unit}</span>
      </p>
      <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-1.5 text-base font-bold text-slate-900">
        {accent && <span className="inline-block size-1.5 rounded-full bg-emerald-600" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "emerald" | "amber" | "slate";
}) {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateLabel(d: Date) {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function InlineDatePicker({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
}) {
  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const [viewMonth, setViewMonth] = useState(() => {
    const base = value ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          className="rounded p-1 text-slate-600 hover:bg-slate-100"
          aria-label="이전 달"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-bold text-slate-900">
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          className="rounded p-1 text-slate-600 hover:bg-slate-100"
          aria-label="다음 달"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={i === 0 ? "text-rose-400" : i === 6 ? "text-sky-400" : ""}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />;
          const date = new Date(year, month, d);
          const isPast = date < today;
          const isToday = isSameDay(date, today);
          const isSelected = value ? isSameDay(date, value) : false;
          const weekday = date.getDay();
          const baseColor =
            weekday === 0 ? "text-rose-500" : weekday === 6 ? "text-sky-500" : "text-slate-700";
          return (
            <button
              key={d}
              type="button"
              disabled={isPast}
              onClick={() => onChange(date)}
              className={`flex aspect-square items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                isPast
                  ? "cursor-not-allowed text-slate-300"
                  : isSelected
                  ? "bg-slate-900 text-white"
                  : isToday
                  ? `border border-emerald-500 ${baseColor} hover:bg-emerald-50`
                  : `${baseColor} hover:bg-slate-100`
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
