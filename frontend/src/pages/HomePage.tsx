import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { fetchCultureEvents, fetchInstitutionFacilities } from "../data/seoul";
import { manualSpaces } from "../data/manualSpaces";

interface Facility {
  SVCID?: string;
  SVCNM: string;
  PLACENM: string;
  AREANM: string;
  PAYATNM: string;
  IMGURL?: string;
  SVCURL?: string;
  MINCLASSNM?: string;
  V_MAX?: string;
}

const HOME_CATEGORIES = ["전체", "전시·관람", "공연장", "다목적실", "녹화·촬영", "강당·강의실"];

const CATEGORY_MAP: Record<string, string[]> = {
  "전시·관람": ["전시/관람", "문화행사"],
  "공연장": ["공연장"],
  "다목적실": ["다목적실", "회의실"],
  "강당·강의실": ["강당", "강의실"],
  "녹화·촬영": ["녹화장소"],
};

const ALLOWED_CULTURE = new Set(["전시/관람", "문화행사"]);
const ALLOWED_INSTITUTION = new Set(["강당", "광장", "녹화장소", "공연장", "회의실", "다목적실", "강의실"]);

const FULL_BLEED: React.CSSProperties = {
  width: "100vw",
  marginLeft: "calc(50% - 50vw)",
};

const HERO_IMAGES = ["/main1.jpg", "/main2.jpg", "/main3.jpg", "/main4.jpg"];

export function HomePage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [category, setCategory] = useState("전체");
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIdx((i) => (i + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Promise.all([fetchCultureEvents(), fetchInstitutionFacilities()])
      .then(([cultureData, institutionData]) => {
        const cultureRows: Facility[] = (
          cultureData?.ListPublicReservationCulture?.row ?? []
        ).filter((f: Facility) => ALLOWED_CULTURE.has(f.MINCLASSNM ?? ""));

        const institutionRows: Facility[] = (
          institutionData?.ListPublicReservationInstitution?.row ?? []
        ).filter((f: Facility) => ALLOWED_INSTITUTION.has(f.MINCLASSNM ?? ""));

        const seen = new Set<string>();
        const all = [...cultureRows, ...institutionRows, ...manualSpaces].filter((f) => {
          const key = f.SVCID ?? `${f.SVCNM}__${f.PLACENM}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setFacilities(all);
      })
      .catch(() => setFacilities([]));
  }, []);

  const categorized =
    category === "전체"
      ? facilities
      : facilities.filter((f) => CATEGORY_MAP[category]?.includes(f.MINCLASSNM ?? ""));

  const freeSpaces = facilities.filter((f) => f.PAYATNM === "무료");

  return (
    <div>
      {/* ── Hero ── */}
      <section
        className="relative flex flex-col overflow-hidden"
        style={{
          ...FULL_BLEED,
          minHeight: "100vh",
        }}
      >
        {/* Background slideshow — crossfade between images */}
        {HERO_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
            style={{ opacity: i === heroIdx ? 1 : 0 }}
          />
        ))}

        {/* Centered copy */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          <h1
            className="mb-6 leading-[1.08] text-white"
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: "clamp(2.2rem, 6vw, 4rem)",
              textShadow: "0 2px 24px rgba(0,0,0,0.35)",
            }}
          >
            공간을 찾는<br />모든 창작자를 위해,
          </h1>
          <p
            className="text-xl text-white"
            style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 800, textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
          >
            서울시 공공 유휴공간과 창작자를 연결하는 AI 매칭 플랫폼
          </p>
        </div>

        {/* Bottom card strip — full-width, white bg, black border */}
        <div className="relative flex w-full border-y-2 border-slate-900">
          {[
            {
              to: "/stays",
              label: "둘러보기",
              sub: "서울시 공공공간 80곳을 한눈에 탐색하세요",
              hover: "hover:bg-[#CCFF00]",
              border: "border-r-2 border-slate-900",
            },
            {
              to: "/neighborhood",
              label: "추천받기",
              sub: "전시, 팝업, 촬영, 워크숍 — 목적에 맞는 공간을 추천받아요",
              hover: "hover:bg-[#FF6EC7]",
              border: "",
            },
          ].map(({ to, label, sub, hover, border }) => (
            <Link
              key={to}
              to={to}
              className={`group flex flex-1 flex-col items-center justify-center gap-2 bg-white px-6 py-8 transition-colors duration-200 ${hover} ${border}`}
            >
              <span
                className="flex items-center gap-1.5 text-3xl text-slate-900"
                style={{ fontFamily: "'Black Han Sans', sans-serif" }}
              >
                {label} <ChevronRight className="size-6" />
              </span>
              <span
                className="whitespace-nowrap text-center text-sm text-slate-500 group-hover:text-slate-700"
                style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500 }}
              >
                {sub}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 이런 창작 어때요? ── */}
      <section className="bg-white py-16" style={FULL_BLEED}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-3xl font-black text-slate-900">이런 창작 어때요?</h2>
            <Link
              to="/stays"
              className="flex items-center gap-0.5 text-sm font-bold text-slate-400 hover:text-slate-900"
            >
              전체 보기 <ChevronRight className="size-4" />
            </Link>
          </div>

          {/* Category tabs */}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {HOME_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${
                  category === c
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-900"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categorized.length === 0 ? (
              <p className="shrink-0 py-12 text-sm text-slate-400">
                {facilities.length === 0 ? "불러오는 중..." : "해당 카테고리 공간이 없습니다."}
              </p>
            ) : (
              categorized
                .slice(0, 12)
                .map((f, i) => <SpaceCard key={f.SVCID ?? i} facility={f} />)
            )}
          </div>
        </div>
      </section>

      {/* ── 무료로 쓸 수 있는 공간 ── */}
      <section className="bg-[#F5F0E8] py-16" style={FULL_BLEED}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-emerald-600">
                Free Spaces
              </p>
              <h2 className="text-3xl font-black text-slate-900">무료로 쓸 수 있는 공간</h2>
            </div>
            <Link
              to="/stays"
              className="flex items-center gap-0.5 text-sm font-bold text-slate-400 hover:text-slate-900"
            >
              전체 보기 <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {freeSpaces.length === 0 ? (
              <p className="shrink-0 py-12 text-sm text-slate-400">불러오는 중...</p>
            ) : (
              freeSpaces
                .slice(0, 12)
                .map((f, i) => <SpaceCard key={f.SVCID ?? i} facility={f} beige />)
            )}
          </div>
        </div>
      </section>

      {/* ── AI 매칭 배너 ── */}
      <section className="bg-slate-950 py-28" style={FULL_BLEED}>
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="mb-5 text-[11px] font-black uppercase tracking-[0.35em] text-[#CCFF00]">
            AI Matching
          </p>
          <h2
            className="mb-5 font-black leading-[1.1] tracking-tight text-white"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            어떤 창작을<br />계획하고 있나요?
          </h2>
          <p className="mb-12 text-base text-white/40">
            목적, 인원, 지역을 알려주면 딱 맞는 공간을 찾아드립니다
          </p>
          <Link
            to="/neighborhood"
            className="inline-flex items-center gap-2 rounded-xl bg-[#CCFF00] px-8 py-4 text-base font-black text-slate-900 transition-opacity hover:opacity-85"
          >
            추천받기 <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function SpaceCard({
  facility: f,
  beige = false,
}: {
  facility: Facility;
  beige?: boolean;
}) {
  const isFree = f.PAYATNM === "무료";
  return (
    <div
      onClick={() => f.SVCURL && window.open(f.SVCURL, "_blank")}
      className="group w-52 shrink-0 cursor-pointer"
    >
      <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl bg-slate-100">
        {f.IMGURL ? (
          <img
            src={f.IMGURL}
            alt={f.SVCNM}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full items-center justify-center ${beige ? "bg-[#E8E0D0]" : "bg-slate-100"}`}
          >
            <svg
              className={`size-10 ${beige ? "text-[#C4B89A]" : "text-slate-300"}`}
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
        {isFree && (
          <span className="absolute top-2 left-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-black text-white">
            무료
          </span>
        )}
      </div>
      <p className="mb-0.5 truncate text-sm font-bold text-slate-900">{f.SVCNM}</p>
      <p className="truncate text-xs text-slate-400">
        {f.AREANM}
        {f.PLACENM ? ` · ${f.PLACENM}` : ""}
      </p>
    </div>
  );
}
